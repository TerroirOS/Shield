# Environment Contract

Shield's local environment contract is the expected set of variables for the
pilot stack. The contract is enforced by `npm run check:env-contract` and
reused by `npm run bootstrap:local`.

## Required Variables

| Area | Variables | Notes |
| --- | --- | --- |
| Runtime | `SHIELD_RUNTIME_MODE`, `API_PORT`, `API_BASE_URL`, `INTERNAL_JOB_TOKEN` | `SHIELD_RUNTIME_MODE` must be `MOCK`, `HYBRID`, or `TESTNET`. |
| Data | `DATABASE_URL`, `REDIS_URL` | Local defaults target Docker Compose service ports. |
| Evidence storage | `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` | Used for evidence and packet retention. |
| Auth | `OIDC_ISSUER_URL`, `OIDC_JWKS_URI`, `OIDC_AUDIENCE`, `AUTH_DEV_MODE` | Local auth points at Keycloak. `AUTH_DEV_MODE` must be `true` or `false`. |
| Dashboard | `NEXT_PUBLIC_API_URL` | Browser-facing API base URL. |
| Connectors | `TRACE_API_URL`, `WEATHER_PROVIDER`, `COMMITMENT_RPC_URL`, `TREASURY_EXPORT_TARGET`, `NOTIFICATION_TARGET` | `WEATHER_PROVIDER` must be `mock` or `live`. |
| Observability | `OTEL_EXPORTER_OTLP_ENDPOINT`, `PROMETHEUS_URL`, `LOKI_URL`, `GRAFANA_URL` | Matches the local OTel, Prometheus, Loki, and Grafana services. |

## Local Defaults

The tracked [`.env.example`](../.env.example) encodes the local stack defaults
for:

- Postgres on `localhost:5432`
- Redis on `localhost:6379`
- MinIO API on `localhost:9000`
- Keycloak on `localhost:8081`
- OTel collector on `localhost:4318`
- Prometheus on `localhost:9090`
- Loki on `localhost:3100`
- Grafana on `localhost:3002`

## Validation Rules

- URL-like fields must parse as valid URLs.
- `API_PORT` must be a valid TCP port.
- Runtime and connector mode enums are checked explicitly.
- `.env.example` must contain the full contract, and `.env` is validated too
  when present.

## Operator Guidance

- Keep `.env.example` aligned with `docker-compose.yml` whenever local service
  ports or endpoints change.
- Treat `INTERNAL_JOB_TOKEN` as the worker-to-API trust boundary even in local
  mode.
- If a new connector or telemetry sink is introduced, add its variables to the
  contract before relying on them in runtime code.
