import crypto from "node:crypto";
import type { EnrollmentRecord, PayoutExportBatch, WeatherEventPacket } from "@terroiros/domain";
import type {
  CommitmentAdapter,
  NotificationAdapter,
  TraceConnector,
  TreasuryExportAdapter,
  WeatherConnector
} from "./interfaces.js";

const MOCK_ENROLLMENTS: EnrollmentRecord[] = [
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
  }
];

export class MockTraceConnector implements TraceConnector {
  async getEnrollment(enrollmentId: string): Promise<EnrollmentRecord | null> {
    return MOCK_ENROLLMENTS.find((entry) => entry.enrollmentId === enrollmentId) ?? null;
  }

  async getAttestations(batchId: string) {
    return [
      { issuer: "lab-kakheti", trustTier: "LAB_ATTESTED", valid: true },
      { issuer: `cert-${batchId}`, trustTier: "AUTHORITY_ATTESTED", valid: true }
    ];
  }

  async getBatchProof(batchId: string) {
    return { hash: `sha256:${crypto.createHash("sha256").update(batchId).digest("hex")}`, anchoredAt: new Date().toISOString() };
  }
}

export class MockWeatherConnector implements WeatherConnector {
  async fetchObservations(programId: string): Promise<WeatherEventPacket[]> {
    return [
      {
        eventId: `evt-${Date.now()}`,
        programId,
        hazardType: "HAIL",
        observedAt: new Date().toISOString(),
        hailIntensity: 0.71,
        frostIndicator: 0,
        minTemperature: 2,
        droughtIndex: 0.41,
        source: "mock-weather-station",
        signature: "mock-signature"
      }
    ];
  }

  async verifySource(_packet: WeatherEventPacket): Promise<boolean> {
    return true;
  }
}

export class MockCommitmentAdapter implements CommitmentAdapter {
  private readonly cache = new Map<string, string>();

  async commitHash(entityId: string, hash: string) {
    this.cache.set(entityId, hash);
    return {
      commitmentId: crypto.randomUUID(),
      anchorRef: `mock-anchor:${entityId}`
    };
  }

  async verifyCommitment(entityId: string, hash: string) {
    return this.cache.get(entityId) === hash;
  }
}

export class MockTreasuryExportAdapter implements TreasuryExportAdapter {
  async emitBatch(batch: PayoutExportBatch) {
    return {
      accepted: true,
      externalRef: `mock-export-${batch.exportId}`
    };
  }

  async status(): Promise<"PENDING" | "SENT" | "FAILED"> {
    return "SENT";
  }
}

export class MockNotificationAdapter implements NotificationAdapter {
  async publishAlert(message: string, severity: "info" | "warn" | "critical") {
    console.log(`[notification:${severity}] ${message}`);
  }

  async sendDigest(subject: string, lines: string[]) {
    console.log(`[digest] ${subject}\n${lines.join("\n")}`);
  }
}
