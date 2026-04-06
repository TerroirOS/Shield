import { z } from "zod";
import { caseSeverities, caseStatuses, hazardTypes } from "./types.js";

export const weatherEventPacketSchema = z.object({
  eventId: z.string().min(3),
  programId: z.string().min(3),
  hazardType: z.enum(hazardTypes),
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
  status: z.enum(caseStatuses).optional(),
  severity: z.enum(caseSeverities).optional(),
  programId: z.string().optional()
});
