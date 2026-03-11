import crypto from "node:crypto";
import type {
  BasisRiskSnapshot,
  PayoutDecision,
  PayoutPreviewInput,
  TriggerEvaluation,
  TriggerEvaluationInput
} from "./types.js";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function evaluateTrigger(input: TriggerEvaluationInput): TriggerEvaluation {
  const { event, program, enrollment } = input;
  const reasonCodes: string[] = [];
  let triggerMet = false;

  if (event.hailIntensity >= program.thresholds.hailThreshold) {
    reasonCodes.push("HAIL_THRESHOLD_MET");
    triggerMet = true;
  }

  if (event.frostIndicator >= program.thresholds.frostThreshold) {
    reasonCodes.push("FROST_THRESHOLD_MET");
    triggerMet = true;
  }

  if (event.minTemperature <= program.thresholds.minTemperatureThreshold) {
    reasonCodes.push("MIN_TEMP_THRESHOLD_MET");
    triggerMet = true;
  }

  if (event.droughtIndex >= program.thresholds.droughtThreshold) {
    reasonCodes.push("DROUGHT_THRESHOLD_MET");
    triggerMet = true;
  }

  if (!triggerMet) {
    reasonCodes.push("NO_TRIGGER");
  }

  if (enrollment.trustTier === "SELF_ATTESTED") {
    reasonCodes.push("LOW_TRUST_ENROLLMENT");
  }

  const severityRaw =
    program.weights.alpha * event.hailIntensity +
    program.weights.beta * event.frostIndicator +
    program.weights.gamma * event.droughtIndex;
  const severityScore = round2(Math.min(Math.max(severityRaw, 0), 1.5));

  const requiresManualReview =
    enrollment.trustTier === "SELF_ATTESTED" || severityScore >= 1.2;

  return {
    evaluationId: crypto.randomUUID(),
    eventId: event.eventId,
    programId: program.programId,
    enrollmentId: enrollment.enrollmentId,
    triggerMet,
    reasonCodes,
    requiresManualReview,
    basisRiskFlag: severityScore >= 1,
    severityScore,
    ruleVersion: program.ruleVersion,
    status: requiresManualReview ? "REVIEW_REQUIRED" : "EVALUATED",
    createdAt: new Date().toISOString()
  };
}

export function computePayout(input: PayoutPreviewInput): PayoutDecision {
  const { evaluation, event, program, enrollment } = input;

  const weightedImpact =
    program.weights.alpha * event.hailIntensity +
    program.weights.beta * event.frostIndicator +
    program.weights.gamma * event.droughtIndex;
  const unclamped = weightedImpact * enrollment.areaHectares * program.payoutCap;
  const payoutAmount = round2(Math.min(Math.max(unclamped, 0), program.payoutCap));

  const rationale = [
    `weightedImpact=${round2(weightedImpact)}`,
    `areaHectares=${enrollment.areaHectares}`,
    `payoutCap=${program.payoutCap}`
  ];

  if (!evaluation.triggerMet) {
    rationale.push("No threshold met, payout set to zero");
  }

  return {
    decisionId: crypto.randomUUID(),
    evaluationId: evaluation.evaluationId,
    eventId: event.eventId,
    programId: program.programId,
    enrollmentId: enrollment.enrollmentId,
    payoutAmount: evaluation.triggerMet ? payoutAmount : 0,
    payoutCap: program.payoutCap,
    currency: program.currency,
    requiresManualReview: evaluation.requiresManualReview,
    basisRiskFlag: evaluation.basisRiskFlag,
    status: evaluation.requiresManualReview ? "HELD" : "DRAFT",
    ruleVersion: program.ruleVersion,
    rationale
  };
}

export function calculateBasisRiskSnapshot(input: {
  programId: string;
  eventId: string;
  payouts: number[];
  losses: number[];
}): BasisRiskSnapshot {
  const payoutCount = input.payouts.length;
  const lossCount = input.losses.length;
  const size = Math.max(payoutCount, lossCount, 1);

  const paddedPayouts = [...input.payouts, ...Array(Math.max(0, size - payoutCount)).fill(0)];
  const paddedLosses = [...input.losses, ...Array(Math.max(0, size - lossCount)).fill(0)];

  let totalGap = 0;
  let flaggedCases = 0;

  for (let i = 0; i < size; i += 1) {
    const gap = Math.abs(paddedLosses[i] - paddedPayouts[i]);
    totalGap += gap;
    if (gap > 0.35 * Math.max(paddedLosses[i], 1)) {
      flaggedCases += 1;
    }
  }

  const avgPayout = paddedPayouts.reduce((acc, value) => acc + value, 0) / size;
  const avgReportedLoss = paddedLosses.reduce((acc, value) => acc + value, 0) / size;

  return {
    programId: input.programId,
    eventId: input.eventId,
    expectedGap: round2(totalGap / size),
    avgPayout: round2(avgPayout),
    avgReportedLoss: round2(avgReportedLoss),
    flaggedCases,
    generatedAt: new Date().toISOString()
  };
}
