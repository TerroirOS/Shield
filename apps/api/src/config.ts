import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env" });

const envSchema = z.object({
  API_PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().min(1).default("postgres://shield:shield@localhost:5432/shield"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  SHIELD_RUNTIME_MODE: z.enum(["MOCK", "HYBRID", "TESTNET"]).default("MOCK"),
  OIDC_ISSUER_URL: z.string().default("http://localhost:8081/realms/shield"),
  OIDC_JWKS_URI: z.string().default("http://localhost:8081/realms/shield/protocol/openid-connect/certs"),
  OIDC_AUDIENCE: z.string().default("shield-api"),
  AUTH_DEV_MODE: z.string().default("true"),
  INTERNAL_JOB_TOKEN: z.string().default("dev-internal-token"),
  TREASURY_EXPORT_TARGET: z.string().default("sftp://finance.local/shield")
});

const parsed = envSchema.parse(process.env);

export const config = {
  ...parsed,
  AUTH_DEV_MODE: parsed.AUTH_DEV_MODE === "true"
};
