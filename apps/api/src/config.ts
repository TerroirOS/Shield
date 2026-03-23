import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env" });

const envSchema = z.object({
  API_PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1).default("postgres://shield:shield@localhost:5432/shield"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  SHIELD_RUNTIME_MODE: z.enum(["MOCK", "HYBRID", "TESTNET"]).default("MOCK"),
  MINIO_ENDPOINT: z.string().url().default("http://localhost:9000"),
  MINIO_ACCESS_KEY: z.string().min(1).default("minioadmin"),
  MINIO_SECRET_KEY: z.string().min(1).default("minioadmin"),
  MINIO_BUCKET: z.string().min(1).default("shield-evidence"),
  OIDC_ISSUER_URL: z.string().default("http://localhost:8081/realms/shield"),
  OIDC_JWKS_URI: z.string().default("http://localhost:8081/realms/shield/protocol/openid-connect/certs"),
  OIDC_AUDIENCE: z.string().default("shield-api"),
  AUTH_DEV_MODE: z.string().default("true"),
  INTERNAL_JOB_TOKEN: z.string().default("dev-internal-token"),
  TRACE_API_URL: z.string().url().default("http://localhost:8090"),
  WEATHER_PROVIDER: z.enum(["mock", "live"]).default("mock"),
  COMMITMENT_RPC_URL: z.string().url().default("https://example-testnet-rpc.invalid"),
  TREASURY_EXPORT_TARGET: z.string().min(1).default("sftp://finance.local/shield"),
  NOTIFICATION_TARGET: z.string().min(1).default("slack://ops-room"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().default("http://localhost:4318"),
  PROMETHEUS_URL: z.string().url().default("http://localhost:9090"),
  LOKI_URL: z.string().url().default("http://localhost:3100"),
  GRAFANA_URL: z.string().url().default("http://localhost:3002")
});

const parsed = envSchema.parse(process.env);

export const config = {
  ...parsed,
  AUTH_DEV_MODE: parsed.AUTH_DEV_MODE === "true"
};
