import { z } from "zod";
import {
  auditEntityTypes,
  caseSeverities,
  caseStatuses,
  decisionStatuses,
  enrollmentStatuses,
  evaluationStatuses,
  exportStatuses,
  hazardTypes,
  roles,
  runtimeModes,
  triggerReasonCodes,
  trustTiers
} from "./types.js";

const idSchema = z.string().min(3);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date");
const isoDateTimeSchema = z.string().datetime();
const nonNegativeFiniteNumberSchema = z.number().finite().min(0);
const boundedUnitSchema = z.number().finite().min(0).max(1);

export const runtimeModeSchema = z.enum(runtimeModes);
export const roleSchema = z.enum(roles);
export const actorRoleSchema = z.union([roleSchema, z.literal("system")]);
export const hazardTypeSchema = z.enum(hazardTypes);
export const enrollmentStatusSchema = z.enum(enrollmentStatuses);
export const trustTierSchema = z.enum(trustTiers);
export const triggerReasonCodeSchema = z.enum(triggerReasonCodes);
export const triggerEvaluationStatusSchema = z.enum(evaluationStatuses);
export const payoutDecisionStatusSchema = z.enum(decisionStatuses);
export const payoutExportStatusSchema = z.enum(exportStatuses);
export const caseSeveritySchema = z.enum(caseSeverities);
export const caseStatusSchema = z.enum(caseStatuses);
export const auditEntityTypeSchema = z.enum(auditEntityTypes);

export const programThresholdsSchema = z.object({
  hailThreshold: nonNegativeFiniteNumberSchema,
  frostThreshold: boundedUnitSchema,
  minTemperatureThreshold: z.number().finite(),
  droughtThreshold: boundedUnitSchema
});

export const programWeightsSchema = z.object({
  alpha: boundedUnitSchema,
  beta: boundedUnitSchema,
  gamma: boundedUnitSchema
}).refine((weights) => weights.alpha + weights.beta + weights.gamma <= 1.5, {
  message: "Program weights must stay within supported severity normalization bounds"
});

export const programConfigSchema = z.object({
  programId: idSchema,
  name: z.string().min(1),
  region: z.string().min(1),
  currency: z.string().length(3),
  payoutCap: nonNegativeFiniteNumberSchema,
  thresholds: programThresholdsSchema,
  weights: programWeightsSchema,
  effectiveFrom: isoDateSchema,
  effectiveTo: isoDateSchema,
  ruleVersion: z.string().min(1)
}).refine((program) => program.effectiveFrom <= program.effectiveTo, {
  message: "Program effectiveFrom must be on or before effectiveTo",
  path: ["effectiveTo"]
});

export const enrollmentRecordSchema = z.object({
  enrollmentId: idSchema,
  programId: idSchema,
  participantRef: z.string().min(1),
  batchId: z.string().min(1),
  areaHectares: nonNegativeFiniteNumberSchema,
  status: enrollmentStatusSchema,
  trustTier: trustTierSchema
});

export const weatherEventPacketSchema = z.object({
  eventId: idSchema,
  programId: idSchema,
  hazardType: hazardTypeSchema,
  observedAt: isoDateTimeSchema,
  hailIntensity: nonNegativeFiniteNumberSchema,
  frostIndicator: boundedUnitSchema,
  minTemperature: z.number().finite(),
  droughtIndex: boundedUnitSchema,
  source: z.string().min(1),
  signature: z.string().min(8)
});

export const triggerEvaluationSchema = z.object({
  evaluationId: idSchema,
  eventId: idSchema,
  programId: idSchema,
  enrollmentId: idSchema,
  triggerMet: z.boolean(),
  reasonCodes: z.array(triggerReasonCodeSchema).min(1),
  requiresManualReview: z.boolean(),
  basisRiskFlag: z.boolean(),
  severityScore: z.number().finite().min(0).max(1.5),
  ruleVersion: z.string().min(1),
  status: triggerEvaluationStatusSchema,
  createdAt: isoDateTimeSchema
});

export const payoutDecisionSchema = z.object({
  decisionId: idSchema,
  evaluationId: idSchema,
  eventId: idSchema,
  programId: idSchema,
  enrollmentId: idSchema,
  payoutAmount: nonNegativeFiniteNumberSchema,
  payoutCap: nonNegativeFiniteNumberSchema,
  currency: z.string().length(3),
  requiresManualReview: z.boolean(),
  basisRiskFlag: z.boolean(),
  status: payoutDecisionStatusSchema,
  approvedBy: z.string().min(1).optional(),
  approvedAt: isoDateTimeSchema.optional(),
  ruleVersion: z.string().min(1),
  rationale: z.array(z.string().min(1)).min(1)
}).refine((decision) => decision.payoutAmount <= decision.payoutCap, {
  message: "Payout amount cannot exceed payout cap",
  path: ["payoutAmount"]
});

export const payoutExportBatchSchema = z.object({
  exportId: idSchema,
  programId: idSchema,
  decisionIds: z.array(idSchema).min(1),
  generatedAt: isoDateTimeSchema,
  target: z.string().min(1),
  signature: z.string().min(8),
  status: payoutExportStatusSchema
});

export const basisRiskSnapshotSchema = z.object({
  programId: idSchema,
  eventId: idSchema,
  expectedGap: nonNegativeFiniteNumberSchema,
  avgPayout: nonNegativeFiniteNumberSchema,
  avgReportedLoss: nonNegativeFiniteNumberSchema,
  flaggedCases: z.number().int().min(0),
  generatedAt: isoDateTimeSchema
});

export const auditLogEntrySchema = z.object({
  auditId: idSchema,
  actorId: z.string().min(1),
  actorRole: actorRoleSchema,
  action: z.string().min(1),
  entityType: auditEntityTypeSchema,
  entityId: idSchema,
  hash: z.string().min(8),
  createdAt: isoDateTimeSchema
});

export const caseRecordSchema = z.object({
  caseId: idSchema,
  programId: idSchema,
  eventId: idSchema,
  enrollmentId: idSchema,
  decisionId: idSchema,
  severity: caseSeveritySchema,
  status: caseStatusSchema,
  reason: z.string().min(1),
  createdAt: isoDateTimeSchema
});

export const triggerEvaluationInputSchema = z.object({
  event: weatherEventPacketSchema,
  program: programConfigSchema,
  enrollment: enrollmentRecordSchema
});

export const payoutPreviewInputSchema = z.object({
  evaluation: triggerEvaluationSchema,
  event: weatherEventPacketSchema,
  program: programConfigSchema,
  enrollment: enrollmentRecordSchema
});

export const triggerEvaluationRequestSchema = z.object({
  eventId: idSchema,
  enrollmentId: idSchema
});

export const payoutPreviewRequestSchema = z.object({
  evaluationId: idSchema,
  reportedLoss: nonNegativeFiniteNumberSchema.optional()
});

export const caseFilterSchema = z.object({
  status: caseStatusSchema.optional(),
  severity: caseSeveritySchema.optional(),
  programId: z.string().min(1).optional()
});
