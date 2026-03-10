# Integration Guide

Status: Planned / not launched.

## Integration Surfaces

- Event ingestion API (`POST /v1/events/ingest`)
- Event retrieval API (`GET /v1/events/{event_id}`)
- Trigger evaluation API (`POST /v1/triggers/evaluate`)
- Payout simulation API (`POST /v1/payouts/simulate`)
- Public reporting API (`GET /v1/reports/public`)

## Integration Expectations

- Use stable IDs (`event_id`, `program_id`, `evaluation_id`, `decision_id`).
- Send geospatial data in GeoJSON-compatible structure.
- Include source metadata and evidence references for all normative event inputs.
- Treat simulation outputs as governed artifacts, not unconditional execution instructions.

## Suggested Client Workflow

1. Submit a normalized event.
2. Retrieve event and validate status.
3. Trigger evaluation with selected rule version.
4. Simulate response amount.
5. Query public report projection.
6. If flagged, open review process before finalization.

## Standards Alignment

- RFC 7946 (GeoJSON) for location interoperability.
- OGC SensorThings conceptual compatibility for observation semantics.
