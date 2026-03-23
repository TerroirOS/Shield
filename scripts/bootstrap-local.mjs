import fs from "node:fs";
import path from "node:path";

import { parseEnvFile, validateEntries } from "./env-contract.mjs";

const repoRoot = process.cwd();
const envExamplePath = path.join(repoRoot, ".env.example");
const envPath = path.join(repoRoot, ".env");
const pathEntries = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);

function ensureEnvFile() {
  if (fs.existsSync(envPath)) {
    return false;
  }

  fs.copyFileSync(envExamplePath, envPath);
  return true;
}

function commandExists(commandName) {
  const extensions = process.platform === "win32" ? [".exe", ".cmd", ".bat"] : [""];

  for (const directory of pathEntries) {
    for (const extension of extensions) {
      if (fs.existsSync(path.join(directory, `${commandName}${extension}`))) {
        return true;
      }
    }
  }

  return false;
}

function summarizeTooling() {
  const missingPackages = ["typescript", "tsx", "next"].filter((packageName) => {
    return !fs.existsSync(path.join(repoRoot, "node_modules", packageName, "package.json"));
  });

  return {
    npmAvailable: commandExists("npm"),
    dockerAvailable: commandExists("docker"),
    missingPackages,
  };
}

function validateEnv(entries) {
  const result = validateEntries(entries, ".env");
  if (!result.ok) {
    console.error("Shield local bootstrap failed: environment contract validation failed.");
    for (const problem of result.problems) {
      console.error(`- ${problem}`);
    }
    process.exit(1);
  }
}

function printSummary(entries, createdEnvFile, tooling) {
  console.log("Shield local bootstrap ready.");
  console.log(`- .env file: ${createdEnvFile ? "created from .env.example" : "already present"}`);
  console.log(`- Runtime mode: ${entries.SHIELD_RUNTIME_MODE}`);
  console.log(`- API URL: ${entries.API_BASE_URL}`);
  console.log(`- Dashboard URL: http://localhost:3000`);
  console.log(`- Database URL: ${entries.DATABASE_URL}`);
  console.log(`- Redis URL: ${entries.REDIS_URL}`);
  console.log(`- Keycloak issuer: ${entries.OIDC_ISSUER_URL}`);
  console.log(`- MinIO endpoint: ${entries.MINIO_ENDPOINT}`);
  console.log(`- OTel collector: ${entries.OTEL_EXPORTER_OTLP_ENDPOINT}`);
  console.log(`- Prometheus URL: ${entries.PROMETHEUS_URL}`);
  console.log(`- Grafana URL: ${entries.GRAFANA_URL}`);
  console.log(`- npm on PATH: ${tooling.npmAvailable ? "yes" : "no"}`);
  console.log(`- Docker on PATH: ${tooling.dockerAvailable ? "yes" : "no"}`);
  console.log(
    `- Cached workspace toolchain: ${tooling.missingPackages.length === 0 ? "ready" : `missing ${tooling.missingPackages.join(", ")}`}`,
  );
  console.log("Next steps:");
  console.log("1. npm install");
  console.log("2. npm run build");
  console.log("3. npm test");
  console.log("4. docker compose up --build");
}

if (!fs.existsSync(envExamplePath)) {
  console.error(".env.example is missing. Cannot bootstrap local Shield environment.");
  process.exit(1);
}

const createdEnvFile = ensureEnvFile();
const envEntries = parseEnvFile(envPath);
const tooling = summarizeTooling();

validateEnv(envEntries);
printSummary(envEntries, createdEnvFile, tooling);
