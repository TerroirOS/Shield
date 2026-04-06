export const runtimeModes = ["MOCK", "HYBRID", "TESTNET"] as const;
export type RuntimeMode = (typeof runtimeModes)[number];

export const roles = ["ops", "auditor", "admin"] as const;
export type Role = (typeof roles)[number];

export type ActorRole = Role | "system";

export const hazardTypes = ["HAIL", "FROST", "DROUGHT"] as const;
export type HazardType = (typeof hazardTypes)[number];

export const enrollmentStatuses = ["ACTIVE", "PENDING", "SUSPENDED", "CLOSED"] as const;
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

export const trustTiers = ["SELF_ATTESTED", "LAB_ATTESTED", "AUTHORITY_ATTESTED"] as const;
export type TrustTier = (typeof trustTiers)[number];

export const triggerReasonCodes = [
  "HAIL_THRESHOLD_MET",
  "FROST_THRESHOLD_MET",
  "MIN_TEMP_THRESHOLD_MET",
  "DROUGHT_THRESHOLD_MET",
  "LOW_TRUST_ENROLLMENT",
  "NO_TRIGGER"
] as const;
export type TriggerReasonCode = (typeof triggerReasonCodes)[number];

export const evaluationStatuses = ["EVALUATED", "REVIEW_REQUIRED"] as const;
export type TriggerEvaluationStatus = (typeof evaluationStatuses)[number];

export const decisionStatuses = ["DRAFT", "APPROVED", "HELD", "REJECTED"] as const;
export type PayoutDecisionStatus = (typeof decisionStatuses)[number];

export const exportStatuses = ["GENERATED", "SENT", "FAILED"] as const;
export type PayoutExportStatus = (typeof exportStatuses)[number];

export const caseSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type CaseSeverity = (typeof caseSeverities)[number];

export const caseStatuses = ["OPEN", "UNDER_REVIEW", "RESOLVED"] as const;
export type CaseStatus = (typeof caseStatuses)[number];

export const auditEntityTypes = ["event", "evaluation", "decision", "export", "program", "case"] as const;
export type AuditEntityType = (typeof auditEntityTypes)[number];

export type IsoDateString = string;
export type IsoDateTimeString = string;

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
  effectiveFrom: IsoDateString;
  effectiveTo: IsoDateString;
  ruleVersion: string;
}

export interface EnrollmentRecord {
  enrollmentId: string;
  programId: string;
  participantRef: string;
  batchId: string;
  areaHectares: number;
  status: EnrollmentStatus;
  trustTier: TrustTier;
}

export interface WeatherEventPacket {
  eventId: string;
  programId: string;
  hazardType: HazardType;
  observedAt: IsoDateTimeString;
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
  reasonCodes: TriggerReasonCode[];
  requiresManualReview: boolean;
  basisRiskFlag: boolean;
  severityScore: number;
  ruleVersion: string;
  status: TriggerEvaluationStatus;
  createdAt: IsoDateTimeString;
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
  status: PayoutDecisionStatus;
  approvedBy?: string;
  approvedAt?: IsoDateTimeString;
  ruleVersion: string;
  rationale: string[];
}

export interface PayoutExportBatch {
  exportId: string;
  programId: string;
  decisionIds: string[];
  generatedAt: IsoDateTimeString;
  target: string;
  signature: string;
  status: PayoutExportStatus;
}

export interface BasisRiskSnapshot {
  programId: string;
  eventId: string;
  expectedGap: number;
  avgPayout: number;
  avgReportedLoss: number;
  flaggedCases: number;
  generatedAt: IsoDateTimeString;
}

export interface AuditLogEntry {
  auditId: string;
  actorId: string;
  actorRole: ActorRole;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  hash: string;
  createdAt: IsoDateTimeString;
}

export interface CaseRecord {
  caseId: string;
  programId: string;
  eventId: string;
  enrollmentId: string;
  decisionId: string;
  severity: CaseSeverity;
  status: CaseStatus;
  reason: string;
  createdAt: IsoDateTimeString;
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
