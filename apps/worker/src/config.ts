import dotenv from "dotenv";

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env" });

const runtimeModes = new Set(["MOCK", "HYBRID", "TESTNET"]);

function readRequiredEnv(key: string, fallback: string) {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

const REDIS_URL = readRequiredEnv("REDIS_URL", "redis://localhost:6379");
const API_BASE_URL = readRequiredEnv("API_BASE_URL", "http://localhost:8080");
const INTERNAL_JOB_TOKEN = readRequiredEnv("INTERNAL_JOB_TOKEN", "dev-internal-token");
const SHIELD_RUNTIME_MODE = readRequiredEnv("SHIELD_RUNTIME_MODE", "MOCK");

if (!runtimeModes.has(SHIELD_RUNTIME_MODE)) {
  throw new Error("SHIELD_RUNTIME_MODE must be one of: MOCK, HYBRID, TESTNET.");
}

export const config = {
  REDIS_URL,
  API_BASE_URL,
  INTERNAL_JOB_TOKEN,
  SHIELD_RUNTIME_MODE
};
