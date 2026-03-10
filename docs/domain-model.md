# Domain Model

Status: Planned / not launched.

## Entities

### VineyardEnrollment

Represents the program enrollment state for a participating vineyard or producer unit.

Key fields:

- `enrollment_id`
- `program_id`
- `participant_ref`
- `location`
- `coverage_window`
- `status`

### ClimateEvent

Represents an observed climate condition relevant to trigger logic.

Key fields:

- `event_id`
- `program_id`
- `location`
- `observed_at`
- `hazard_type`
- `severity`
- `data_source`
- `evidence_refs`
- `integrity_hash`
- `status`

### TriggerEvaluation

Represents deterministic rule evaluation for one event/program context.

Key fields:

- `evaluation_id`
- `event_id`
- `program_id`
- `rule_version`
- `trigger_met`
- `reason_codes`
- `basis_risk_flag`
- `requires_manual_review`

### PayoutDecision

Represents recommended response output and governance metadata.

Key fields:

- `decision_id`
- `evaluation_id`
- `event_id`
- `program_id`
- `recommended_amount`
- `currency`
- `appeal_window_days`
- `status`

### AppealCase

Represents a formal review path for contested or exceptional decisions.

Key fields:

- `appeal_id`
- `decision_id`
- `opened_at`
- `opened_by`
- `reason`
- `resolution_status`

## Cross-Cutting Envelope Fields

The following fields are standardized across event and decision artifacts:

- `event_id`
- `program_id`
- `location`
- `observed_at`
- `data_source`
- `evidence_refs`
- `integrity_hash`
- `status`
