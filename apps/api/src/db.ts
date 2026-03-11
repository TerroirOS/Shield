import crypto from "node:crypto";
import { Pool } from "pg";
import type {
  AuditLogEntry,
  BasisRiskSnapshot,
  CaseRecord,
  EnrollmentRecord,
  PayoutDecision,
  ProgramConfig,
  TriggerEvaluation,
  WeatherEventPacket
} from "@terroiros/domain";

export class Db {
  readonly pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS programs (
        program_id TEXT PRIMARY KEY,
        payload JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS enrollments (
        enrollment_id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        payload JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS events (
        event_id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS evaluations (
        evaluation_id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        enrollment_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS decisions (
        decision_id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        enrollment_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS cases (
        case_id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        enrollment_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS basis_risk_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        program_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        audit_id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS payout_exports (
        export_id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }

  async seedDefaults(): Promise<void> {
    const existing = await this.pool.query("SELECT program_id FROM programs LIMIT 1");
    if (existing.rowCount && existing.rowCount > 0) {
      return;
    }

    const program: ProgramConfig = {
      programId: "program-kakheti-2026",
      name: "Kakheti Vineyard Climate Relief 2026",
      region: "Kakheti",
      currency: "GEL",
      payoutCap: 4500,
      thresholds: {
        hailThreshold: 0.6,
        frostThreshold: 1,
        minTemperatureThreshold: -1,
        droughtThreshold: 0.7
      },
      weights: {
        alpha: 0.5,
        beta: 0.25,
        gamma: 0.25
      },
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      ruleVersion: "1.0.0"
    };

    const enrollments: EnrollmentRecord[] = [
      {
        enrollmentId: "enr-kakheti-001",
        programId: program.programId,
        participantRef: "producer-001",
        batchId: "batch-kakheti-001",
        areaHectares: 2.4,
        status: "ACTIVE",
        trustTier: "LAB_ATTESTED"
      },
      {
        enrollmentId: "enr-kakheti-002",
        programId: program.programId,
        participantRef: "producer-002",
        batchId: "batch-kakheti-002",
        areaHectares: 1.8,
        status: "ACTIVE",
        trustTier: "SELF_ATTESTED"
      }
    ];

    await this.saveProgram(program);
    for (const enrollment of enrollments) {
      await this.saveEnrollment(enrollment);
    }

    const seedEvent: WeatherEventPacket = {
      eventId: "evt-kakheti-seed-001",
      programId: program.programId,
      hazardType: "HAIL",
      observedAt: new Date().toISOString(),
      hailIntensity: 0.72,
      frostIndicator: 0,
      minTemperature: 2,
      droughtIndex: 0.52,
      source: "seed-weather-station",
      signature: "seed-signature"
    };

    const seedEvaluation: TriggerEvaluation = {
      evaluationId: "eval-kakheti-seed-001",
      eventId: seedEvent.eventId,
      programId: program.programId,
      enrollmentId: enrollments[1]!.enrollmentId,
      triggerMet: true,
      reasonCodes: ["HAIL_THRESHOLD_MET", "LOW_TRUST_ENROLLMENT"],
      requiresManualReview: true,
      basisRiskFlag: true,
      severityScore: 1.13,
      ruleVersion: program.ruleVersion,
      status: "REVIEW_REQUIRED",
      createdAt: new Date().toISOString()
    };

    const seedDecision: PayoutDecision = {
      decisionId: "dec-kakheti-seed-001",
      evaluationId: seedEvaluation.evaluationId,
      eventId: seedEvent.eventId,
      programId: program.programId,
      enrollmentId: enrollments[1]!.enrollmentId,
      payoutAmount: 2100,
      payoutCap: program.payoutCap,
      currency: program.currency,
      requiresManualReview: true,
      basisRiskFlag: true,
      status: "HELD",
      ruleVersion: program.ruleVersion,
      rationale: ["seeded baseline decision"]
    };

    const seedCase: CaseRecord = {
      caseId: "case-kakheti-seed-001",
      programId: program.programId,
      eventId: seedEvent.eventId,
      enrollmentId: enrollments[1]!.enrollmentId,
      decisionId: seedDecision.decisionId,
      severity: "HIGH",
      status: "UNDER_REVIEW",
      reason: "HAIL_THRESHOLD_MET, LOW_TRUST_ENROLLMENT",
      createdAt: new Date().toISOString()
    };

    const seedSnapshot: BasisRiskSnapshot = {
      programId: program.programId,
      eventId: seedEvent.eventId,
      expectedGap: 480,
      avgPayout: 2100,
      avgReportedLoss: 2580,
      flaggedCases: 1,
      generatedAt: new Date().toISOString()
    };

    await this.saveEvent(seedEvent);
    await this.saveEvaluation(seedEvaluation);
    await this.saveDecision(seedDecision);
    await this.saveCase(seedCase);
    await this.saveBasisRiskSnapshot(seedSnapshot);
  }

  async saveProgram(program: ProgramConfig): Promise<void> {
    await this.pool.query(
      `INSERT INTO programs (program_id, payload)
       VALUES ($1, $2)
       ON CONFLICT (program_id) DO UPDATE SET payload = EXCLUDED.payload`,
      [program.programId, JSON.stringify(program)]
    );
  }

  async getProgram(programId: string): Promise<ProgramConfig | null> {
    const res = await this.pool.query("SELECT payload FROM programs WHERE program_id = $1", [programId]);
    return (res.rows[0]?.payload as ProgramConfig | undefined) ?? null;
  }

  async saveEnrollment(enrollment: EnrollmentRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO enrollments (enrollment_id, program_id, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (enrollment_id) DO UPDATE SET payload = EXCLUDED.payload`,
      [enrollment.enrollmentId, enrollment.programId, JSON.stringify(enrollment)]
    );
  }

  async getEnrollment(enrollmentId: string): Promise<EnrollmentRecord | null> {
    const res = await this.pool.query("SELECT payload FROM enrollments WHERE enrollment_id = $1", [enrollmentId]);
    return (res.rows[0]?.payload as EnrollmentRecord | undefined) ?? null;
  }

  async listProgramEnrollments(programId: string): Promise<EnrollmentRecord[]> {
    const res = await this.pool.query("SELECT payload FROM enrollments WHERE program_id = $1 ORDER BY enrollment_id", [programId]);
    return res.rows.map((row: { payload: unknown }) => row.payload as EnrollmentRecord);
  }

  async saveEvent(event: WeatherEventPacket): Promise<void> {
    await this.pool.query(
      `INSERT INTO events (event_id, program_id, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id) DO UPDATE SET payload = EXCLUDED.payload`,
      [event.eventId, event.programId, JSON.stringify(event)]
    );
  }

  async getEvent(eventId: string): Promise<WeatherEventPacket | null> {
    const res = await this.pool.query("SELECT payload FROM events WHERE event_id = $1", [eventId]);
    return (res.rows[0]?.payload as WeatherEventPacket | undefined) ?? null;
  }

  async listEvents(limit = 50): Promise<WeatherEventPacket[]> {
    const res = await this.pool.query("SELECT payload FROM events ORDER BY created_at DESC LIMIT $1", [limit]);
    return res.rows.map((row: { payload: unknown }) => row.payload as WeatherEventPacket);
  }

  async saveEvaluation(evaluation: TriggerEvaluation): Promise<void> {
    await this.pool.query(
      `INSERT INTO evaluations (evaluation_id, event_id, enrollment_id, payload)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (evaluation_id) DO UPDATE SET payload = EXCLUDED.payload`,
      [evaluation.evaluationId, evaluation.eventId, evaluation.enrollmentId, JSON.stringify(evaluation)]
    );
  }

  async getEvaluation(evaluationId: string): Promise<TriggerEvaluation | null> {
    const res = await this.pool.query("SELECT payload FROM evaluations WHERE evaluation_id = $1", [evaluationId]);
    return (res.rows[0]?.payload as TriggerEvaluation | undefined) ?? null;
  }

  async listEvaluationsByEvent(eventId: string): Promise<TriggerEvaluation[]> {
    const res = await this.pool.query("SELECT payload FROM evaluations WHERE event_id = $1 ORDER BY created_at DESC", [eventId]);
    return res.rows.map((row: { payload: unknown }) => row.payload as TriggerEvaluation);
  }

  async saveDecision(decision: PayoutDecision): Promise<void> {
    await this.pool.query(
      `INSERT INTO decisions (decision_id, program_id, event_id, enrollment_id, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (decision_id) DO UPDATE SET payload = EXCLUDED.payload`,
      [decision.decisionId, decision.programId, decision.eventId, decision.enrollmentId, JSON.stringify(decision)]
    );
  }

  async getDecision(decisionId: string): Promise<PayoutDecision | null> {
    const res = await this.pool.query("SELECT payload FROM decisions WHERE decision_id = $1", [decisionId]);
    return (res.rows[0]?.payload as PayoutDecision | undefined) ?? null;
  }

  async listDecisions(limit = 100): Promise<PayoutDecision[]> {
    const res = await this.pool.query("SELECT payload FROM decisions ORDER BY created_at DESC LIMIT $1", [limit]);
    return res.rows.map((row: { payload: unknown }) => row.payload as PayoutDecision);
  }

  async saveCase(caseRecord: CaseRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO cases (case_id, program_id, event_id, enrollment_id, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (case_id) DO UPDATE SET payload = EXCLUDED.payload`,
      [caseRecord.caseId, caseRecord.programId, caseRecord.eventId, caseRecord.enrollmentId, JSON.stringify(caseRecord)]
    );
  }

  async getCase(caseId: string): Promise<CaseRecord | null> {
    const res = await this.pool.query("SELECT payload FROM cases WHERE case_id = $1", [caseId]);
    return (res.rows[0]?.payload as CaseRecord | undefined) ?? null;
  }

  async listCases(filters: { status?: string; severity?: string; programId?: string }): Promise<CaseRecord[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (filters.programId) {
      values.push(filters.programId);
      clauses.push(`program_id = $${values.length}`);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const res = await this.pool.query(`SELECT payload FROM cases ${whereClause} ORDER BY created_at DESC LIMIT 200`, values);

    return res.rows
      .map((row: { payload: unknown }) => row.payload as CaseRecord)
      .filter((record: CaseRecord) => {
        if (filters.status && record.status !== filters.status) return false;
        if (filters.severity && record.severity !== filters.severity) return false;
        return true;
      });
  }

  async saveBasisRiskSnapshot(snapshot: BasisRiskSnapshot): Promise<void> {
    await this.pool.query(
      `INSERT INTO basis_risk_snapshots (snapshot_id, program_id, event_id, payload)
       VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), snapshot.programId, snapshot.eventId, JSON.stringify(snapshot)]
    );
  }

  async latestBasisRiskSnapshot(programId: string): Promise<BasisRiskSnapshot | null> {
    const res = await this.pool.query(
      "SELECT payload FROM basis_risk_snapshots WHERE program_id = $1 ORDER BY created_at DESC LIMIT 1",
      [programId]
    );
    return (res.rows[0]?.payload as BasisRiskSnapshot | undefined) ?? null;
  }

  async listBasisRiskSnapshots(programId: string): Promise<BasisRiskSnapshot[]> {
    const res = await this.pool.query(
      "SELECT payload FROM basis_risk_snapshots WHERE program_id = $1 ORDER BY created_at DESC LIMIT 24",
      [programId]
    );
    return res.rows.map((row: { payload: unknown }) => row.payload as BasisRiskSnapshot);
  }

  async saveAudit(entry: AuditLogEntry): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_log (audit_id, entity_id, payload)
       VALUES ($1, $2, $3)`,
      [entry.auditId, entry.entityId, JSON.stringify(entry)]
    );
  }

  async listAuditByEntity(entityId: string): Promise<AuditLogEntry[]> {
    const res = await this.pool.query("SELECT payload FROM audit_log WHERE entity_id = $1 ORDER BY created_at DESC", [entityId]);
    return res.rows.map((row: { payload: unknown }) => row.payload as AuditLogEntry);
  }

  async savePayoutExport(payload: unknown & { exportId: string }): Promise<void> {
    await this.pool.query(
      `INSERT INTO payout_exports (export_id, payload)
       VALUES ($1, $2)
       ON CONFLICT (export_id) DO UPDATE SET payload = EXCLUDED.payload`,
      [payload.exportId, JSON.stringify(payload)]
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
