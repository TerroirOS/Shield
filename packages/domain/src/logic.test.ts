import test from "node:test";
import assert from "node:assert/strict";
import { caseSeverities, caseStatuses, hazardTypes, triggerReasonCodes } from "./types.js";
import { calculateBasisRiskSnapshot, computePayout, evaluateTrigger } from "./logic.js";
import { caseFilterSchema, weatherEventPacketSchema } from "./schemas.js";
import type { EnrollmentRecord, ProgramConfig, WeatherEventPacket } from "./types.js";

const program: ProgramConfig = {
  programId: "program-kakheti-2026",
  name: "Kakheti Climate Relief",
  region: "Kakheti",
  currency: "GEL",
  payoutCap: 5000,
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

const enrollment: EnrollmentRecord = {
  enrollmentId: "enr-1",
  programId: program.programId,
  participantRef: "producer-101",
  batchId: "batch-1",
  areaHectares: 2,
  status: "ACTIVE",
  trustTier: "LAB_ATTESTED"
};

const eventPacket: WeatherEventPacket = {
  eventId: "evt-1",
  programId: program.programId,
  hazardType: "HAIL",
  observedAt: "2026-03-10T12:00:00Z",
  hailIntensity: 0.62,
  frostIndicator: 0,
  minTemperature: 2,
  droughtIndex: 0.4,
  source: "mock",
  signature: "sig-valid"
};

test("evaluateTrigger flags hail threshold", () => {
  const evaluation = evaluateTrigger({ event: eventPacket, program, enrollment });
  assert.equal(evaluation.triggerMet, true);
  assert.equal(evaluation.reasonCodes.includes("HAIL_THRESHOLD_MET"), true);
  assert.equal(evaluation.status, "EVALUATED");
});

test("computePayout respects cap", () => {
  const evaluation = evaluateTrigger({ event: eventPacket, program, enrollment });
  const decision = computePayout({ evaluation, event: eventPacket, program, enrollment });
  assert.equal(decision.payoutAmount <= program.payoutCap, true);
});

test("basis risk snapshot computes expected gap", () => {
  const snapshot = calculateBasisRiskSnapshot({
    programId: "p1",
    eventId: "e1",
    payouts: [100, 100],
    losses: [200, 100]
  });
  assert.equal(snapshot.expectedGap, 50);
  assert.equal(snapshot.flaggedCases >= 0, true);
});

test("contract enum exports remain aligned with supported statuses", () => {
  assert.deepEqual(hazardTypes, ["HAIL", "FROST", "DROUGHT"]);
  assert.deepEqual(caseStatuses, ["OPEN", "UNDER_REVIEW", "RESOLVED"]);
  assert.deepEqual(caseSeverities, ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
  assert.equal(triggerReasonCodes.includes("LOW_TRUST_ENROLLMENT"), true);
});

test("schemas consume normalized contract enums", () => {
  const packet = weatherEventPacketSchema.parse(eventPacket);
  const filters = caseFilterSchema.parse({ status: "OPEN", severity: "HIGH", programId: "program-kakheti-2026" });

  assert.equal(packet.hazardType, "HAIL");
  assert.deepEqual(filters, { status: "OPEN", severity: "HIGH", programId: "program-kakheti-2026" });
});
