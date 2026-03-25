import crypto from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env" });

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL ?? "postgres://shield:shield@localhost:5432/shield";

const seedPrograms = [
  {
    program: {
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
    },
    enrollments: [
      {
        enrollmentId: "enr-kakheti-001",
        programId: "program-kakheti-2026",
        participantRef: "producer-001",
        batchId: "batch-kakheti-001",
        areaHectares: 2.4,
        status: "ACTIVE",
        trustTier: "LAB_ATTESTED"
      },
      {
        enrollmentId: "enr-kakheti-002",
        programId: "program-kakheti-2026",
        participantRef: "producer-002",
        batchId: "batch-kakheti-002",
        areaHectares: 1.8,
        status: "ACTIVE",
        trustTier: "SELF_ATTESTED"
      },
      {
        enrollmentId: "enr-kakheti-003",
        programId: "program-kakheti-2026",
        participantRef: "producer-003",
        batchId: "batch-kakheti-003",
        areaHectares: 3.1,
        status: "ACTIVE",
        trustTier: "AUTHORITY_ATTESTED"
      }
    ],
    events: [
      {
        eventId: "evt-kakheti-hail-001",
        programId: "program-kakheti-2026",
        hazardType: "HAIL",
        observedAt: "2026-05-12T11:30:00.000Z",
        hailIntensity: 0.72,
        frostIndicator: 0,
        minTemperature: 2,
        droughtIndex: 0.52,
        source: "station-kakheti-04",
        signature: "seed-signature-hail-001"
      },
      {
        eventId: "evt-kakheti-frost-001",
        programId: "program-kakheti-2026",
        hazardType: "FROST",
        observedAt: "2026-03-28T03:00:00.000Z",
        hailIntensity: 0.05,
        frostIndicator: 1,
        minTemperature: -2.4,
        droughtIndex: 0.22,
        source: "station-kakheti-02",
        signature: "seed-signature-frost-001"
      }
    ],
    evaluations: [
      {
        evaluationId: "eval-kakheti-hail-001",
        eventId: "evt-kakheti-hail-001",
        programId: "program-kakheti-2026",
        enrollmentId: "enr-kakheti-002",
        triggerMet: true,
        reasonCodes: ["HAIL_THRESHOLD_MET", "LOW_TRUST_ENROLLMENT"],
        requiresManualReview: true,
        basisRiskFlag: true,
        severityScore: 1.13,
        ruleVersion: "1.0.0",
        status: "REVIEW_REQUIRED",
        createdAt: "2026-05-12T11:45:00.000Z"
      },
      {
        evaluationId: "eval-kakheti-frost-001",
        eventId: "evt-kakheti-frost-001",
        programId: "program-kakheti-2026",
        enrollmentId: "enr-kakheti-003",
        triggerMet: true,
        reasonCodes: ["FROST_THRESHOLD_MET", "AUTHORITY_CONFIRMED"],
        requiresManualReview: false,
        basisRiskFlag: false,
        severityScore: 0.81,
        ruleVersion: "1.0.0",
        status: "EVALUATED",
        createdAt: "2026-03-28T03:15:00.000Z"
      }
    ],
    decisions: [
      {
        decisionId: "dec-kakheti-hail-001",
        evaluationId: "eval-kakheti-hail-001",
        eventId: "evt-kakheti-hail-001",
        programId: "program-kakheti-2026",
        enrollmentId: "enr-kakheti-002",
        payoutAmount: 2100,
        payoutCap: 4500,
        currency: "GEL",
        requiresManualReview: true,
        basisRiskFlag: true,
        status: "HELD",
        ruleVersion: "1.0.0",
        rationale: ["seeded hail decision", "manual review due to self attestation"]
      },
      {
        decisionId: "dec-kakheti-frost-001",
        evaluationId: "eval-kakheti-frost-001",
        eventId: "evt-kakheti-frost-001",
        programId: "program-kakheti-2026",
        enrollmentId: "enr-kakheti-003",
        payoutAmount: 1680,
        payoutCap: 4500,
        currency: "GEL",
        requiresManualReview: false,
        basisRiskFlag: false,
        status: "APPROVED",
        approvedBy: "ops-seed-admin",
        approvedAt: "2026-03-28T04:00:00.000Z",
        ruleVersion: "1.0.0",
        rationale: ["seeded frost decision", "trusted authority attestation"]
      }
    ],
    cases: [
      {
        caseId: "case-kakheti-hail-001",
        programId: "program-kakheti-2026",
        eventId: "evt-kakheti-hail-001",
        enrollmentId: "enr-kakheti-002",
        decisionId: "dec-kakheti-hail-001",
        severity: "HIGH",
        status: "UNDER_REVIEW",
        reason: "HAIL_THRESHOLD_MET, LOW_TRUST_ENROLLMENT",
        createdAt: "2026-05-12T12:00:00.000Z"
      },
      {
        caseId: "case-kakheti-frost-001",
        programId: "program-kakheti-2026",
        eventId: "evt-kakheti-frost-001",
        enrollmentId: "enr-kakheti-003",
        decisionId: "dec-kakheti-frost-001",
        severity: "MEDIUM",
        status: "RESOLVED",
        reason: "FROST_THRESHOLD_MET",
        createdAt: "2026-03-28T04:10:00.000Z"
      }
    ],
    snapshots: [
      {
        programId: "program-kakheti-2026",
        eventId: "evt-kakheti-hail-001",
        expectedGap: 480,
        avgPayout: 2100,
        avgReportedLoss: 2580,
        flaggedCases: 1,
        generatedAt: "2026-05-12T12:20:00.000Z"
      },
      {
        programId: "program-kakheti-2026",
        eventId: "evt-kakheti-frost-001",
        expectedGap: 120,
        avgPayout: 1680,
        avgReportedLoss: 1800,
        flaggedCases: 0,
        generatedAt: "2026-03-28T04:15:00.000Z"
      }
    ],
    audits: [
      {
        auditId: "audit-kakheti-event-001",
        actorId: "seed-system",
        actorRole: "system",
        action: "events.weather.ingested",
        entityType: "event",
        entityId: "evt-kakheti-hail-001",
        hash: "sha256:seed-kakheti-event",
        createdAt: "2026-05-12T11:31:00.000Z"
      },
      {
        auditId: "audit-kakheti-decision-001",
        actorId: "ops-seed-admin",
        actorRole: "ops",
        action: "decision.approved",
        entityType: "decision",
        entityId: "dec-kakheti-frost-001",
        hash: "seed-commitment-anchor-kakheti",
        createdAt: "2026-03-28T04:00:30.000Z"
      }
    ],
    exports: [
      {
        exportId: "exp-kakheti-001",
        programId: "program-kakheti-2026",
        decisionIds: ["dec-kakheti-frost-001"],
        generatedAt: "2026-03-28T04:20:00.000Z",
        target: "sftp://finance.local/shield",
        signature: "sha256:seed-export-kakheti",
        status: "SENT"
      }
    ]
  },
  {
    program: {
      programId: "program-imereti-2026",
      name: "Imereti Olive Drought Buffer 2026",
      region: "Imereti",
      currency: "GEL",
      payoutCap: 3200,
      thresholds: {
        hailThreshold: 0.55,
        frostThreshold: 1,
        minTemperatureThreshold: -0.5,
        droughtThreshold: 0.65
      },
      weights: {
        alpha: 0.35,
        beta: 0.3,
        gamma: 0.35
      },
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      ruleVersion: "1.1.0"
    },
    enrollments: [
      {
        enrollmentId: "enr-imereti-001",
        programId: "program-imereti-2026",
        participantRef: "olive-grower-001",
        batchId: "olive-batch-101",
        areaHectares: 4.7,
        status: "ACTIVE",
        trustTier: "LAB_ATTESTED"
      },
      {
        enrollmentId: "enr-imereti-002",
        programId: "program-imereti-2026",
        participantRef: "olive-grower-002",
        batchId: "olive-batch-102",
        areaHectares: 3.9,
        status: "PENDING",
        trustTier: "SELF_ATTESTED"
      }
    ],
    events: [
      {
        eventId: "evt-imereti-drought-001",
        programId: "program-imereti-2026",
        hazardType: "DROUGHT",
        observedAt: "2026-07-20T08:00:00.000Z",
        hailIntensity: 0.02,
        frostIndicator: 0,
        minTemperature: 18,
        droughtIndex: 0.78,
        source: "satellite-precip-11",
        signature: "seed-signature-drought-001"
      }
    ],
    evaluations: [
      {
        evaluationId: "eval-imereti-drought-001",
        eventId: "evt-imereti-drought-001",
        programId: "program-imereti-2026",
        enrollmentId: "enr-imereti-001",
        triggerMet: true,
        reasonCodes: ["DROUGHT_THRESHOLD_MET"],
        requiresManualReview: false,
        basisRiskFlag: false,
        severityScore: 0.74,
        ruleVersion: "1.1.0",
        status: "EVALUATED",
        createdAt: "2026-07-20T08:10:00.000Z"
      },
      {
        evaluationId: "eval-imereti-drought-002",
        eventId: "evt-imereti-drought-001",
        programId: "program-imereti-2026",
        enrollmentId: "enr-imereti-002",
        triggerMet: true,
        reasonCodes: ["DROUGHT_THRESHOLD_MET", "PENDING_ENROLLMENT_STATUS"],
        requiresManualReview: true,
        basisRiskFlag: true,
        severityScore: 0.96,
        ruleVersion: "1.1.0",
        status: "REVIEW_REQUIRED",
        createdAt: "2026-07-20T08:12:00.000Z"
      }
    ],
    decisions: [
      {
        decisionId: "dec-imereti-drought-001",
        evaluationId: "eval-imereti-drought-001",
        eventId: "evt-imereti-drought-001",
        programId: "program-imereti-2026",
        enrollmentId: "enr-imereti-001",
        payoutAmount: 2400,
        payoutCap: 3200,
        currency: "GEL",
        requiresManualReview: false,
        basisRiskFlag: false,
        status: "DRAFT",
        ruleVersion: "1.1.0",
        rationale: ["seeded drought draft decision"]
      },
      {
        decisionId: "dec-imereti-drought-002",
        evaluationId: "eval-imereti-drought-002",
        eventId: "evt-imereti-drought-001",
        programId: "program-imereti-2026",
        enrollmentId: "enr-imereti-002",
        payoutAmount: 1800,
        payoutCap: 3200,
        currency: "GEL",
        requiresManualReview: true,
        basisRiskFlag: true,
        status: "HELD",
        ruleVersion: "1.1.0",
        rationale: ["pending enrollment needs operator review"]
      }
    ],
    cases: [
      {
        caseId: "case-imereti-drought-001",
        programId: "program-imereti-2026",
        eventId: "evt-imereti-drought-001",
        enrollmentId: "enr-imereti-002",
        decisionId: "dec-imereti-drought-002",
        severity: "HIGH",
        status: "UNDER_REVIEW",
        reason: "DROUGHT_THRESHOLD_MET, PENDING_ENROLLMENT_STATUS",
        createdAt: "2026-07-20T08:15:00.000Z"
      }
    ],
    snapshots: [
      {
        programId: "program-imereti-2026",
        eventId: "evt-imereti-drought-001",
        expectedGap: 305,
        avgPayout: 2100,
        avgReportedLoss: 2405,
        flaggedCases: 1,
        generatedAt: "2026-07-20T08:30:00.000Z"
      }
    ],
    audits: [
      {
        auditId: "audit-imereti-event-001",
        actorId: "seed-system",
        actorRole: "system",
        action: "events.weather.ingested",
        entityType: "event",
        entityId: "evt-imereti-drought-001",
        hash: "sha256:seed-imereti-event",
        createdAt: "2026-07-20T08:00:30.000Z"
      }
    ],
    exports: []
  }
];

async function initSchema(pool) {
  await pool.query(`
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

async function clearProgram(pool, programId) {
  await pool.query("DELETE FROM payout_exports WHERE payload->>'programId' = $1", [programId]);
  await pool.query("DELETE FROM audit_log WHERE payload->>'entityId' IN (SELECT decision_id FROM decisions WHERE program_id = $1)", [programId]);
  await pool.query("DELETE FROM audit_log WHERE payload->>'entityId' IN (SELECT event_id FROM events WHERE program_id = $1)", [programId]);
  await pool.query("DELETE FROM basis_risk_snapshots WHERE program_id = $1", [programId]);
  await pool.query("DELETE FROM cases WHERE program_id = $1", [programId]);
  await pool.query("DELETE FROM decisions WHERE program_id = $1", [programId]);
  await pool.query("DELETE FROM evaluations WHERE event_id IN (SELECT event_id FROM events WHERE program_id = $1)", [programId]);
  await pool.query("DELETE FROM events WHERE program_id = $1", [programId]);
  await pool.query("DELETE FROM enrollments WHERE program_id = $1", [programId]);
  await pool.query("DELETE FROM programs WHERE program_id = $1", [programId]);
}

async function insertJson(pool, sql, params) {
  await pool.query(sql, params);
}

async function seedProgram(pool, scenario) {
  await clearProgram(pool, scenario.program.programId);

  await insertJson(
    pool,
    "INSERT INTO programs (program_id, payload) VALUES ($1, $2)",
    [scenario.program.programId, JSON.stringify(scenario.program)]
  );

  for (const enrollment of scenario.enrollments) {
    await insertJson(
      pool,
      "INSERT INTO enrollments (enrollment_id, program_id, payload) VALUES ($1, $2, $3)",
      [enrollment.enrollmentId, enrollment.programId, JSON.stringify(enrollment)]
    );
  }

  for (const event of scenario.events) {
    await insertJson(
      pool,
      "INSERT INTO events (event_id, program_id, payload, created_at) VALUES ($1, $2, $3, $4)",
      [event.eventId, event.programId, JSON.stringify(event), event.observedAt]
    );
  }

  for (const evaluation of scenario.evaluations) {
    await insertJson(
      pool,
      "INSERT INTO evaluations (evaluation_id, event_id, enrollment_id, payload, created_at) VALUES ($1, $2, $3, $4, $5)",
      [evaluation.evaluationId, evaluation.eventId, evaluation.enrollmentId, JSON.stringify(evaluation), evaluation.createdAt]
    );
  }

  for (const decision of scenario.decisions) {
    await insertJson(
      pool,
      "INSERT INTO decisions (decision_id, program_id, event_id, enrollment_id, payload, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        decision.decisionId,
        decision.programId,
        decision.eventId,
        decision.enrollmentId,
        JSON.stringify(decision),
        decision.approvedAt ?? scenario.evaluations.find((item) => item.evaluationId === decision.evaluationId)?.createdAt ?? new Date().toISOString()
      ]
    );
  }

  for (const caseRecord of scenario.cases) {
    await insertJson(
      pool,
      "INSERT INTO cases (case_id, program_id, event_id, enrollment_id, payload, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [caseRecord.caseId, caseRecord.programId, caseRecord.eventId, caseRecord.enrollmentId, JSON.stringify(caseRecord), caseRecord.createdAt]
    );
  }

  for (const snapshot of scenario.snapshots) {
    await insertJson(
      pool,
      "INSERT INTO basis_risk_snapshots (snapshot_id, program_id, event_id, payload, created_at) VALUES ($1, $2, $3, $4, $5)",
      [crypto.randomUUID(), snapshot.programId, snapshot.eventId, JSON.stringify(snapshot), snapshot.generatedAt]
    );
  }

  for (const audit of scenario.audits) {
    await insertJson(
      pool,
      "INSERT INTO audit_log (audit_id, entity_id, payload, created_at) VALUES ($1, $2, $3, $4)",
      [audit.auditId, audit.entityId, JSON.stringify(audit), audit.createdAt]
    );
  }

  for (const exportBatch of scenario.exports) {
    await insertJson(
      pool,
      "INSERT INTO payout_exports (export_id, payload, created_at) VALUES ($1, $2, $3)",
      [exportBatch.exportId, JSON.stringify(exportBatch), exportBatch.generatedAt]
    );
  }

  return {
    programId: scenario.program.programId,
    enrollments: scenario.enrollments.length,
    events: scenario.events.length,
    evaluations: scenario.evaluations.length,
    decisions: scenario.decisions.length,
    cases: scenario.cases.length
  };
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await initSchema(pool);
    const summaries = [];

    for (const scenario of seedPrograms) {
      summaries.push(await seedProgram(pool, scenario));
    }

    console.log("Seeded Shield developer data:");
    for (const summary of summaries) {
      console.log(
        `- ${summary.programId}: ${summary.enrollments} enrollments, ${summary.events} events, ${summary.evaluations} evaluations, ${summary.decisions} decisions, ${summary.cases} cases`
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Failed to seed Shield developer data.");
  process.exit(1);
});
