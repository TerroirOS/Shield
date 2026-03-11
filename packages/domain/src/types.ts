export type RuntimeMode = "MOCK" | "HYBRID" | "TESTNET";

export type Role = "ops" | "auditor" | "admin";

export type HazardType = "HAIL" | "FROST" | "DROUGHT";

export interface ProgramThresholds {
  hailThreshold: number;
  frostThreshold: number;
  minTemperatureThreshold: number;
  droughtThreshold: number;
}

export interface ProgramWeights {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface ProgramConfig {
  programId: string;
  name: string;
  region: string;
  currency: string;
  payoutCap: number;
  thresholds: ProgramThresholds;
  weights: ProgramWeights;
  effectiveFrom: string;
  effectiveTo: string;
  ruleVersion: string;
}

export interface EnrollmentRecord {
  enrollmentId: string;
  programId: string;
  participantRef: string;
  batchId: string;
  areaHectares: number;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "CLOSED";
  trustTier: "SELF_ATTESTED" | "LAB_ATTESTED" | "AUTHORITY_ATTESTED";
}

export interface WeatherEventPacket {
  eventId: string;
  programId: string;
  hazardType: HazardType;
  observedAt: string;
  hailIntensity: number;
  frostIndicator: number;
  minTemperature: number;
  droughtIndex: number;
  source: string;
  signature: string;
}

export interface TriggerEvaluation {
  evaluationId: string;
  eventId: string;
  programId: string;
  enrollmentId: string;
  triggerMet: boolean;
  reasonCodes: string[];
  requiresManualReview: boolean;
  basisRiskFlag: boolean;
  severityScore: number;
  ruleVersion: string;
  status: "EVALUATED" | "REVIEW_REQUIRED";
  createdAt: string;
}

export interface PayoutDecision {
  decisionId: string;
  evaluationId: string;
  eventId: string;
  programId: string;
  enrollmentId: string;
  payoutAmount: number;
  payoutCap: number;
  currency: string;
  requiresManualReview: boolean;
  basisRiskFlag: boolean;
  status: "DRAFT" | "APPROVED" | "HELD" | "REJECTED";
  approvedBy?: string;
  approvedAt?: string;
  ruleVersion: string;
  rationale: string[];
}

export interface PayoutExportBatch {
  exportId: string;
  programId: string;
  decisionIds: string[];
  generatedAt: string;
  target: string;
  signature: string;
  status: "GENERATED" | "SENT" | "FAILED";
}

export interface BasisRiskSnapshot {
  programId: string;
  eventId: string;
  expectedGap: number;
  avgPayout: number;
  avgReportedLoss: number;
  flaggedCases: number;
  generatedAt: string;
}

export interface AuditLogEntry {
  auditId: string;
  actorId: string;
  actorRole: Role | "system";
  action: string;
  entityType: "event" | "evaluation" | "decision" | "export" | "program" | "case";
  entityId: string;
  hash: string;
  createdAt: string;
}

export interface CaseRecord {
  caseId: string;
  programId: string;
  eventId: string;
  enrollmentId: string;
  decisionId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  reason: string;
  createdAt: string;
}

export interface TriggerEvaluationInput {
  event: WeatherEventPacket;
  program: ProgramConfig;
  enrollment: EnrollmentRecord;
}

export interface PayoutPreviewInput {
  evaluation: TriggerEvaluation;
  event: WeatherEventPacket;
  program: ProgramConfig;
  enrollment: EnrollmentRecord;
}
