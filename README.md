# Terroir Shield

Terroir Shield is the resilience module of TerroirOS, extending provenance systems with climate-risk visibility, event tracking, and future support for transparent response and payout workflows.

Status: Planned / not launched.

## Repository Purpose

This repository provides a documentation-first and specification-first foundation for Shield.
It does not ship production services yet.

## What Is Included

- Architecture and lifecycle documentation for the planned module.
- Governance and controls model for auditable decisioning.
- OpenAPI and JSON Schema specification pack for integration planning.
- Source-backed research bibliography and evidence matrix.
- Contributor workflows, issue templates, and CI checks.

## Quick Links

- [Documentation Index](docs/index.md)
- [Overview](docs/overview.md)
- [Architecture](docs/architecture.md)
- [Domain Model](docs/domain-model.md)
- [Event Lifecycle](docs/event-lifecycle.md)
- [Trigger and Payout Logic](docs/trigger-payout-logic.md)
- [Governance and Controls](docs/governance-and-controls.md)
- [Integration Guide](docs/integration-guide.md)
- [Implementation Roadmap](docs/implementation-roadmap.md)
- [Glossary](docs/glossary.md)
- [Research Bibliography](docs/research/bibliography.md)
- [Evidence Matrix](docs/research/evidence-matrix.md)

## Specification Pack

- [OpenAPI v1](spec/openapi/shield-api.v1.yaml)
- [Schemas](spec/schemas/)
- [Examples](spec/examples/)

Core planned schema types:

- `VineyardEnrollment`
- `ClimateEvent`
- `TriggerEvaluation`
- `PayoutDecision`
- `AppealCase`

Standardized event-envelope fields used across decision artifacts:

- `event_id`
- `program_id`
- `location` (GeoJSON-compatible)
- `observed_at` (ISO-8601)
- `data_source`
- `evidence_refs`
- `integrity_hash`
- `status`

Governance flags included in decisioning artifacts:

- `rule_version`
- `basis_risk_flag`
- `requires_manual_review`
- `appeal_window_days`

## Scope Boundaries

Shield is intended for rapid response and auditable program execution.
It is not represented here as a replacement for regulated insurance products.

## Development

### Prerequisites

- Node.js 20+

### Install

```bash
npm install
```

### Validate docs/specs

```bash
npm run validate
```

Validation includes:

- Markdown lint
- Local markdown link checks
- OpenAPI lint
- JSON Schema validation for examples

## Governance Docs

- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)
