# Terroir Shield

Terroir Shield is the climate-response resilience module in TerroirOS.
This repository now includes a working v1 local stack:

- `apps/dashboard`: command-center operations UI (Next.js 14)
- `apps/api`: Fastify API with OIDC/RBAC hooks and audit workflow
- `apps/worker`: BullMQ worker for evaluations and notifications
- `packages/domain`: shared domain types, schemas, trigger/payout logic
- `packages/connectors`: Trace/weather/commitment/treasury/notification adapters
- `packages/ui`: dashboard UI primitives and design tokens
- `infra/docker`: local runtime for Postgres, Redis, MinIO, Keycloak, OTel, Prometheus, Loki, Grafana

## Runtime Modes

- `MOCK` (default): mock connectors for local development
- `HYBRID`: live external connectors (stubs wired, adapters ready)
- `TESTNET`: commitment adapter path reserved for testnet anchoring

## Prerequisites

- Node.js 20+
- Docker + Docker Compose

## Quick Start

```bash
npm run bootstrap:local
npm install
npm run build
npm test
docker compose up --build
```

Services:

- Dashboard: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8080](http://localhost:8080)
- API Docs: [http://localhost:8080/docs](http://localhost:8080/docs)
- Keycloak: [http://localhost:8081](http://localhost:8081)
- MinIO: [http://localhost:9001](http://localhost:9001)
- Prometheus: [http://localhost:9090](http://localhost:9090)
- Grafana: [http://localhost:3002](http://localhost:3002)

## Local Development (without Docker for app code)

```bash
npm run bootstrap:local
npm install
npm run dev
```

This runs API (`:8080`), worker, and dashboard (`:3000`) in parallel.

## Environment Contract

`npm run bootstrap:local` creates `.env` from `.env.example` when needed, validates the required local stack variables, and prints the expected service endpoints plus a local tooling summary before you start Docker or the app workspaces.

`npm run check:tooling` verifies that the cached root packages required for the monorepo (`typescript`, `tsx`, `next`, `react`, `react-dom`) are actually present before build or test runs start.

## API Surface (v1)

- `POST /v1/events/weather`
- `POST /v1/programs/:id/trigger-evaluations`
- `POST /v1/decisions/preview`
- `POST /v1/decisions/:id/approve`
- `POST /v1/decisions/:id/export`
- `GET /v1/cases`
- `GET /v1/cases/:id`
- `GET /v1/reports/public`
- `GET /v1/basis-risk/metrics`

## Docs + Specs

- [Documentation Index](docs/index.md)
- [OpenAPI v1](spec/openapi/shield-api.v1.yaml)
- [JSON Schemas](spec/schemas/)

## Validation and Tests

```bash
npm run validate
npm test
```

## Notes

- Dev auth uses `AUTH_DEV_MODE=true` and `x-user-role` headers (`ops`, `auditor`, `admin`).
- Public reporting is aggregated and non-PII by default.
- Counterfeit workflows remain out of v1 scope.
