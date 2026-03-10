# Event Lifecycle

Status: Planned / not launched.

This document defines the planned end-to-end lifecycle.

## 1. Enrollment

- Participant is recorded under a specific program.
- Location and coverage window are validated.
- Enrollment status becomes `ACTIVE` only after required checks.

## 2. Event Ingestion

- Event payload is accepted through `POST /v1/events/ingest`.
- Source, timestamp, and geospatial data are normalized.
- Integrity metadata is attached.

## 3. Trigger Evaluation

- Rule engine evaluates event against active program logic.
- Output includes `rule_version`, `trigger_met`, and governance flags.

## 4. Decisioning

- Simulation endpoint computes provisional response amount.
- Decision artifact stores amount, rationale, and appeal window.

## 5. Reporting

- Public report endpoint exposes aggregate and per-event transparent outputs.
- Personally sensitive or protected fields are excluded.

## 6. Appeal and Review

- Any basis-risk or data-quality concern can open an appeal.
- Manual review path records reviewer actions and final resolution.

## Lifecycle State Notes

The current repository does not include runtime services. The lifecycle here is a normative design baseline for future implementation.
