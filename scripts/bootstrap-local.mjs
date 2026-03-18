import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const envExamplePath = path.join(repoRoot, ".env.example");
const envPath = path.join(repoRoot, ".env");

const requiredKeys = [
  "SHIELD_RUNTIME_MODE",
  "API_PORT",
  "DATABASE_URL",
  "REDIS_URL",
  "MINIO_ENDPOINT",
  "MINIO_ACCESS_KEY",
  "MINIO_SECRET_KEY",
  "MINIO_BUCKET",
  "INTERNAL_JOB_TOKEN",
  "API_BASE_URL",
  "OIDC_ISSUER_URL",
  "OIDC_JWKS_URI",
  "OIDC_AUDIENCE",
  "AUTH_DEV_MODE",
  "NEXT_PUBLIC_API_URL",
  "TRACE_API_URL",
  "WEATHER_PROVIDER",
  "COMMITMENT_RPC_URL",
  "TREASURY_EXPORT_TARGET",
  "NOTIFICATION_TARGET"
];

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    entries[key] = value;
  }

  return entries;
}

function ensureEnvFile() {
  if (fs.existsSync(envPath)) {
    return false;
  }

  fs.copyFileSync(envExamplePath, envPath);
  return true;
}

function validateEnv(entries) {
  const missing = requiredKeys.filter((key) => !entries[key]);

  if (missing.length > 0) {
    console.error("Shield local bootstrap failed: missing required environment keys.");
    for (const key of missing) {
      console.error(`- ${key}`);
    }
    process.exit(1);
  }

  const validRuntimeModes = new Set(["MOCK", "HYBRID", "TESTNET"]);
  if (!validRuntimeModes.has(entries.SHIELD_RUNTIME_MODE)) {
    console.error("SHIELD_RUNTIME_MODE must be one of: MOCK, HYBRID, TESTNET.");
    process.exit(1);
  }

  if (!["true", "false"].includes(entries.AUTH_DEV_MODE)) {
    console.error("AUTH_DEV_MODE must be set to true or false.");
    process.exit(1);
  }
}

function printSummary(entries, createdEnvFile) {
  console.log("Shield local bootstrap ready.");
  console.log(`- .env file: ${createdEnvFile ? "created from .env.example" : "already present"}`);
  console.log(`- Runtime mode: ${entries.SHIELD_RUNTIME_MODE}`);
  console.log(`- API URL: ${entries.API_BASE_URL}`);
  console.log(`- Dashboard URL: http://localhost:3000`);
  console.log(`- Database URL: ${entries.DATABASE_URL}`);
  console.log(`- Redis URL: ${entries.REDIS_URL}`);
  console.log(`- Keycloak issuer: ${entries.OIDC_ISSUER_URL}`);
  console.log(`- MinIO endpoint: ${entries.MINIO_ENDPOINT}`);
  console.log("Next steps:");
  console.log("1. npm install");
  console.log("2. docker compose up --build");
  console.log("3. npm run dev");
}

if (!fs.existsSync(envExamplePath)) {
  console.error(".env.example is missing. Cannot bootstrap local Shield environment.");
  process.exit(1);
}

const createdEnvFile = ensureEnvFile();
const envEntries = parseEnvFile(envPath);

validateEnv(envEntries);
printSummary(envEntries, createdEnvFile);
