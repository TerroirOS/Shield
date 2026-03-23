import fs from "node:fs";

const urlLikeKeys = new Set([
  "API_BASE_URL",
  "COMMITMENT_RPC_URL",
  "DATABASE_URL",
  "GRAFANA_URL",
  "LOKI_URL",
  "MINIO_ENDPOINT",
  "NEXT_PUBLIC_API_URL",
  "OIDC_ISSUER_URL",
  "OIDC_JWKS_URI",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "PROMETHEUS_URL",
  "REDIS_URL",
  "TRACE_API_URL"
]);

export const envContract = [
  { key: "SHIELD_RUNTIME_MODE", group: "runtime", allowedValues: ["MOCK", "HYBRID", "TESTNET"] },
  { key: "API_PORT", group: "runtime", validator: "port" },
  { key: "DATABASE_URL", group: "data" },
  { key: "REDIS_URL", group: "data" },
  { key: "API_BASE_URL", group: "runtime" },
  { key: "INTERNAL_JOB_TOKEN", group: "runtime" },
  { key: "MINIO_ENDPOINT", group: "storage" },
  { key: "MINIO_ACCESS_KEY", group: "storage" },
  { key: "MINIO_SECRET_KEY", group: "storage" },
  { key: "MINIO_BUCKET", group: "storage" },
  { key: "OIDC_ISSUER_URL", group: "auth" },
  { key: "OIDC_JWKS_URI", group: "auth" },
  { key: "OIDC_AUDIENCE", group: "auth" },
  { key: "AUTH_DEV_MODE", group: "auth", allowedValues: ["true", "false"] },
  { key: "NEXT_PUBLIC_API_URL", group: "dashboard" },
  { key: "TRACE_API_URL", group: "connectors" },
  { key: "WEATHER_PROVIDER", group: "connectors", allowedValues: ["mock", "live"] },
  { key: "COMMITMENT_RPC_URL", group: "connectors" },
  { key: "TREASURY_EXPORT_TARGET", group: "connectors" },
  { key: "NOTIFICATION_TARGET", group: "connectors" },
  { key: "OTEL_EXPORTER_OTLP_ENDPOINT", group: "observability" },
  { key: "PROMETHEUS_URL", group: "observability" },
  { key: "LOKI_URL", group: "observability" },
  { key: "GRAFANA_URL", group: "observability" }
];

export function parseEnvFile(filePath, fsModule = fs) {
  const content = fsModule.readFileSync(filePath, "utf8");
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

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateEntry(definition, entries, problems) {
  const value = entries[definition.key];

  if (!value) {
    problems.push(`missing ${definition.key}`);
    return;
  }

  if (definition.allowedValues && !definition.allowedValues.includes(value)) {
    problems.push(`${definition.key} must be one of: ${definition.allowedValues.join(", ")}`);
  }

  if (definition.validator === "port") {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      problems.push(`${definition.key} must be a valid TCP port`);
    }
  }

  if (urlLikeKeys.has(definition.key) && !isValidUrl(value)) {
    problems.push(`${definition.key} must be a valid URL`);
  }
}

export function validateEntries(entries, label) {
  const problems = [];

  for (const definition of envContract) {
    validateEntry(definition, entries, problems);
  }

  return {
    label,
    ok: problems.length === 0,
    problems
  };
}

export function requiredKeys() {
  return envContract.map((definition) => definition.key);
}
