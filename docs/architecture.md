# Architecture

Status: Planned / not launched.

## Architectural Layers

1. Enrollment and identity layer.
2. Event ingestion and normalization layer.
3. Trigger evaluation and decisioning layer.
4. Governance review and appeal layer.
5. Public reporting layer.

## Design Principles

- Evidence continuity: every decision links to source records.
- Deterministic logic: trigger outcomes are reproducible from rule version and inputs.
- Separation of concerns: public transparency outputs are distinct from protected records.
- Interoperability: data contracts align with open standards where applicable.

## Data Flow (Planned)

1. `VineyardEnrollment` establishes participant and program linkage.
2. `ClimateEvent` is ingested from approved data sources.
3. `TriggerEvaluation` computes whether thresholds are met.
4. `PayoutDecision` records recommendation and governance flags.
5. `AppealCase` captures review or override workflow when needed.
6. Public report exports aggregated, non-sensitive decision outcomes.

## Interface Mapping

Planned external endpoints are documented in [OpenAPI v1](../spec/openapi/shield-api.v1.yaml).
Core schema contracts are under [spec/schemas](../spec/schemas/).
