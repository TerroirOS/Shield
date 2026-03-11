import crypto from "node:crypto";
import type { JobQueue } from "./worker-queue.js";
import type { Db } from "./db.js";
import type { AuthContext } from "./security.js";
import { calculateBasisRiskSnapshot, computePayout, evaluateTrigger } from "@terroiros/domain";
import type {
  AuditLogEntry,
  CaseRecord,
  EnrollmentRecord,
  PayoutExportBatch,
  PayoutDecision,
  ProgramConfig,
  TriggerEvaluation,
  WeatherEventPacket
} from "@terroiros/domain";
import { createHash } from "node:crypto";
import type { ReturnTypeConnectorSuite } from "./types.js";

function severityFromEvaluation(evaluation: TriggerEvaluation): CaseRecord["severity"] {
  if (evaluation.severityScore >= 1.2) return "CRITICAL";
  if (evaluation.severityScore >= 0.9) return "HIGH";
  if (evaluation.severityScore >= 0.6) return "MEDIUM";
  return "LOW";
}

function auditHash(payload: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`;
}

export class ShieldService {
  constructor(
    private readonly db: Db,
    private readonly connectors: ReturnTypeConnectorSuite,
    private readonly queue: JobQueue
  ) {}

  async ingestWeatherEvent(event: WeatherEventPacket, actor: AuthContext | { userId: string; roles: ["system"] }) {
    const sourceVerified = await this.connectors.weather.verifySource(event);
    if (!sourceVerified) {
      throw new Error("weather_source_verification_failed");
    }

    await this.db.saveEvent(event);
    await this.recordAudit({
      actorId: actor.userId,
      actorRole: (actor.roles[0] ?? "system") as AuditLogEntry["actorRole"],
      action: "events.weather.ingested",
      entityType: "event",
      entityId: event.eventId,
      hash: auditHash(event)
    });

    await this.queue.enqueueEvaluate({ eventId: event.eventId, programId: event.programId });

    return { accepted: true, eventId: event.eventId, status: "RECEIVED" as const };
  }

  async evaluateTriggerForEnrollment(input: { eventId: string; enrollmentId: string }) {
    const event = await this.requireEvent(input.eventId);
    const program = await this.requireProgram(event.programId);
    const enrollment = await this.requireEnrollment(input.enrollmentId);

    const evaluation = evaluateTrigger({ event, program, enrollment });
    await this.db.saveEvaluation(evaluation);

    const decision = computePayout({ evaluation, event, program, enrollment });
    await this.db.saveDecision(decision);

    const caseRecord = this.createCase(evaluation, decision);
    await this.db.saveCase(caseRecord);

    await this.connectors.notifications.publishAlert(
      `Evaluation ${evaluation.evaluationId} created for enrollment ${enrollment.enrollmentId}`,
      caseRecord.severity === "CRITICAL" ? "critical" : "warn"
    );

    await this.recordAudit({
      actorId: "system",
      actorRole: "system",
      action: "evaluation.created",
      entityType: "evaluation",
      entityId: evaluation.evaluationId,
      hash: auditHash(evaluation)
    });

    return { evaluation, decision, caseRecord };
  }

  async evaluateAllForEvent(eventId: string) {
    const event = await this.requireEvent(eventId);
    const enrollments = await this.db.listProgramEnrollments(event.programId);
    const results: Array<{ evaluation: TriggerEvaluation; decision: PayoutDecision; caseRecord: CaseRecord }> = [];

    for (const enrollment of enrollments) {
      results.push(await this.evaluateTriggerForEnrollment({ eventId, enrollmentId: enrollment.enrollmentId }));
    }

    const losses = results.map((result) => result.decision.payoutAmount * (1 + Math.random() * 0.4));
    const payouts = results.map((result) => result.decision.payoutAmount);

    const snapshot = calculateBasisRiskSnapshot({
      programId: event.programId,
      eventId,
      payouts,
      losses
    });

    await this.db.saveBasisRiskSnapshot(snapshot);

    return results;
  }

  async approveDecision(decisionId: string, actor: AuthContext): Promise<PayoutDecision> {
    const decision = await this.requireDecision(decisionId);

    const approved: PayoutDecision = {
      ...decision,
      status: "APPROVED",
      approvedBy: actor.userId,
      approvedAt: new Date().toISOString(),
      requiresManualReview: false
    };

    await this.db.saveDecision(approved);

    const commitment = await this.connectors.commitment.commitHash(
      approved.decisionId,
      auditHash({ decisionId: approved.decisionId, status: approved.status, approvedAt: approved.approvedAt })
    );

    await this.recordAudit({
      actorId: actor.userId,
      actorRole: actor.roles[0] ?? "ops",
      action: "decision.approved",
      entityType: "decision",
      entityId: approved.decisionId,
      hash: commitment.anchorRef
    });

    return approved;
  }

  async exportDecision(decisionId: string, actor: AuthContext) {
    const decision = await this.requireDecision(decisionId);
    const exportPayload: PayoutExportBatch = {
      exportId: crypto.randomUUID(),
      programId: decision.programId,
      decisionIds: [decision.decisionId],
      generatedAt: new Date().toISOString(),
      target: process.env.TREASURY_EXPORT_TARGET ?? "sftp://finance.local/shield",
      signature: auditHash(decision),
      status: "GENERATED"
    };

    await this.db.savePayoutExport(exportPayload);
    const adapterResult = await this.connectors.treasury.emitBatch(exportPayload);

    await this.recordAudit({
      actorId: actor.userId,
      actorRole: actor.roles[0] ?? "ops",
      action: "decision.exported",
      entityType: "export",
      entityId: exportPayload.exportId,
      hash: `${exportPayload.signature}:${adapterResult.externalRef}`
    });

    await this.queue.enqueueNotify({
      subject: `Shield export ${exportPayload.exportId}`,
      lines: [
        `Decision ${decision.decisionId} exported`,
        `External ref: ${adapterResult.externalRef}`
      ]
    });

    return { ...exportPayload, adapterResult };
  }

  async buildCaseDetail(caseId: string) {
    const caseRecord = await this.db.getCase(caseId);
    if (!caseRecord) {
      return null;
    }

    const [event, enrollment, decision, audit] = await Promise.all([
      this.db.getEvent(caseRecord.eventId),
      this.db.getEnrollment(caseRecord.enrollmentId),
      this.db.getDecision(caseRecord.decisionId),
      this.db.listAuditByEntity(caseRecord.decisionId)
    ]);

    return {
      case: caseRecord,
      event,
      enrollment,
      decision,
      audit
    };
  }

  async buildPublicReport(programId: string) {
    const [events, decisions, basisRisk] = await Promise.all([
      this.db.listEvents(200),
      this.db.listDecisions(500),
      this.db.latestBasisRiskSnapshot(programId)
    ]);

    const filteredEvents = events.filter((event) => event.programId === programId);
    const filteredDecisions = decisions.filter((decision) => decision.programId === programId);

    const approvedDecisions = filteredDecisions.filter((decision) => decision.status === "APPROVED");
    const totalApprovedPayout = approvedDecisions.reduce((sum, decision) => sum + decision.payoutAmount, 0);

    return {
      generatedAt: new Date().toISOString(),
      programId,
      totals: {
        ingestedEvents: filteredEvents.length,
        decisions: filteredDecisions.length,
        approvedDecisions: approvedDecisions.length,
        approvedPayoutTotal: Math.round(totalApprovedPayout * 100) / 100
      },
      latestBasisRisk: basisRisk,
      privacy: {
        piiPublished: false,
        aggregationLevel: "program"
      }
    };
  }

  async basisRiskMetrics(programId: string) {
    const snapshots = await this.db.listBasisRiskSnapshots(programId);

    const avgGap = snapshots.length === 0
      ? 0
      : snapshots.reduce((sum, snapshot) => sum + snapshot.expectedGap, 0) / snapshots.length;

    return {
      programId,
      observations: snapshots.length,
      averageExpectedGap: Math.round(avgGap * 100) / 100,
      latest: snapshots[0] ?? null,
      history: snapshots
    };
  }

  private createCase(evaluation: TriggerEvaluation, decision: PayoutDecision): CaseRecord {
    return {
      caseId: crypto.randomUUID(),
      programId: evaluation.programId,
      eventId: evaluation.eventId,
      enrollmentId: evaluation.enrollmentId,
      decisionId: decision.decisionId,
      severity: severityFromEvaluation(evaluation),
      status: evaluation.requiresManualReview ? "UNDER_REVIEW" : "OPEN",
      reason: evaluation.reasonCodes.join(", "),
      createdAt: new Date().toISOString()
    };
  }

  private async requireEvent(eventId: string): Promise<WeatherEventPacket> {
    const event = await this.db.getEvent(eventId);
    if (!event) {
      throw new Error(`event_not_found:${eventId}`);
    }

    return event;
  }

  private async requireEnrollment(enrollmentId: string): Promise<EnrollmentRecord> {
    const enrollment = await this.db.getEnrollment(enrollmentId);
    if (enrollment) {
      return enrollment;
    }

    const fromTrace = await this.connectors.trace.getEnrollment(enrollmentId);
    if (!fromTrace) {
      throw new Error(`enrollment_not_found:${enrollmentId}`);
    }

    await this.db.saveEnrollment(fromTrace);
    return fromTrace;
  }

  private async requireProgram(programId: string): Promise<ProgramConfig> {
    const program = await this.db.getProgram(programId);
    if (!program) {
      throw new Error(`program_not_found:${programId}`);
    }
    return program;
  }

  private async requireDecision(decisionId: string): Promise<PayoutDecision> {
    const decision = await this.db.getDecision(decisionId);
    if (!decision) {
      throw new Error(`decision_not_found:${decisionId}`);
    }
    return decision;
  }

  private async recordAudit(input: Omit<AuditLogEntry, "auditId" | "createdAt">) {
    const entry: AuditLogEntry = {
      ...input,
      auditId: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    await this.db.saveAudit(entry);
  }
}
