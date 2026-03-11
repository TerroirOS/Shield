import { z } from "zod";

export const weatherEventPacketSchema = z.object({
  eventId: z.string().min(3),
  programId: z.string().min(3),
  hazardType: z.enum(["HAIL", "FROST", "DROUGHT"]),
  observedAt: z.string().datetime(),
  hailIntensity: z.number().min(0),
  frostIndicator: z.number().min(0).max(1),
  minTemperature: z.number(),
  droughtIndex: z.number().min(0),
  source: z.string().min(1),
  signature: z.string().min(8)
});

export const triggerEvaluationRequestSchema = z.object({
  eventId: z.string().min(3),
  enrollmentId: z.string().min(3)
});

export const payoutPreviewRequestSchema = z.object({
  evaluationId: z.string().min(3),
  reportedLoss: z.number().min(0).optional()
});

export const caseFilterSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  programId: z.string().optional()
});
