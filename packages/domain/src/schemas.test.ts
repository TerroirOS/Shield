import test from "node:test";
import assert from "node:assert/strict";
import {
  auditLogEntrySchema,
  caseFilterSchema,
  enrollmentRecordSchema,
  payoutDecisionSchema,
  programConfigSchema,
  triggerEvaluationInputSchema,
  weatherEventPacketSchema
} from "./schemas.js";

const program = {
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

const enrollment = {
  enrollmentId: "enr-1",
  programId: program.programId,
  participantRef: "producer-101",
  batchId: "batch-1",
  areaHectares: 2,
  status: "ACTIVE",
  trustTier: "LAB_ATTESTED"
} as const;

const weatherPacket = {
  eventId: "evt-1",
  programId: program.programId,
  hazardType: "HAIL",
  observedAt: "2026-03-10T12:00:00Z",
  hailIntensity: 0.62,
  frostIndicator: 0,
  minTemperature: 2,
  droughtIndex: 0.4,
  source: "mock-weather-adapter",
  signature: "sig-valid"
} as const;

test("programConfigSchema accepts canonical seeded program fixtures", () => {
  const parsed = programConfigSchema.parse(program);
  assert.equal(parsed.currency, "GEL");
  assert.equal(parsed.thresholds.hailThreshold, 0.6);
});

test("programConfigSchema rejects inverted effective date windows", () => {
  const invalidProgram = {
    ...program,
    effectiveFrom: "2026-12-31",
    effectiveTo: "2026-01-01"
  };

  const result = programConfigSchema.safeParse(invalidProgram);
  assert.equal(result.success, false);
});

test("enrollmentRecordSchema rejects unsupported enrollment statuses", () => {
  const result = enrollmentRecordSchema.safeParse({
    ...enrollment,
    status: "ARCHIVED"
  });

  assert.equal(result.success, false);
});

test("weatherEventPacketSchema rejects invalid packet bounds and signatures", () => {
  const result = weatherEventPacketSchema.safeParse({
    ...weatherPacket,
    frostIndicator: 2,
    signature: "short"
  });

  assert.equal(result.success, false);
});

test("triggerEvaluationInputSchema validates full evaluation fixtures", () => {
  const parsed = triggerEvaluationInputSchema.parse({
    event: weatherPacket,
    program,
    enrollment
  });

  assert.equal(parsed.event.hazardType, "HAIL");
  assert.equal(parsed.enrollment.trustTier, "LAB_ATTESTED");
});

test("payoutDecisionSchema rejects payouts above the cap", () => {
  const result = payoutDecisionSchema.safeParse({
    decisionId: "dec-1",
    evaluationId: "eval-1",
    eventId: weatherPacket.eventId,
    programId: program.programId,
    enrollmentId: enrollment.enrollmentId,
    payoutAmount: 5100,
    payoutCap: 5000,
    currency: "GEL",
    requiresManualReview: false,
    basisRiskFlag: false,
    status: "DRAFT",
    ruleVersion: program.ruleVersion,
    rationale: ["weightedImpact=0.31"]
  });

  assert.equal(result.success, false);
});

test("auditLogEntrySchema accepts system-origin audit entries", () => {
  const parsed = auditLogEntrySchema.parse({
    auditId: "aud-1",
    actorId: "system",
    actorRole: "system",
    action: "events.weather.ingested",
    entityType: "event",
    entityId: weatherPacket.eventId,
    hash: "sha256:1234567890abcdef",
    createdAt: "2026-03-10T12:00:00Z"
  });

  assert.equal(parsed.actorRole, "system");
});

test("caseFilterSchema allows operator filters with normalized enums", () => {
  const parsed = caseFilterSchema.parse({
    status: "UNDER_REVIEW",
    severity: "HIGH",
    programId: program.programId
  });

  assert.deepEqual(parsed, {
    status: "UNDER_REVIEW",
    severity: "HIGH",
    programId: program.programId
  });
});
