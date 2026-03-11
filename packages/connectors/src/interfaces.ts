import type { EnrollmentRecord, PayoutExportBatch, WeatherEventPacket } from "@terroiros/domain";

export interface TraceConnector {
  getEnrollment(enrollmentId: string): Promise<EnrollmentRecord | null>;
  getAttestations(batchId: string): Promise<Array<{ issuer: string; trustTier: string; valid: boolean }>>;
  getBatchProof(batchId: string): Promise<{ hash: string; anchoredAt: string } | null>;
}

export interface WeatherConnector {
  fetchObservations(programId: string): Promise<WeatherEventPacket[]>;
  verifySource(packet: WeatherEventPacket): Promise<boolean>;
}

export interface CommitmentAdapter {
  commitHash(entityId: string, hash: string): Promise<{ commitmentId: string; anchorRef: string }>;
  verifyCommitment(entityId: string, hash: string): Promise<boolean>;
}

export interface TreasuryExportAdapter {
  emitBatch(batch: PayoutExportBatch): Promise<{ accepted: boolean; externalRef: string }>;
  status(exportId: string): Promise<"PENDING" | "SENT" | "FAILED">;
}

export interface NotificationAdapter {
  publishAlert(message: string, severity: "info" | "warn" | "critical"): Promise<void>;
  sendDigest(subject: string, lines: string[]): Promise<void>;
}
