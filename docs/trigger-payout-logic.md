# Trigger and Payout Logic

Status: Planned / not launched.

## Scope

This logic describes auditable resilience-response decisioning, not regulated insurance product operations.

## Triggering Baseline

Trigger evaluation should be deterministic from:

- `program_id`
- `rule_version`
- normalized event metrics
- approved source hierarchy

Rule versioning is required so outcomes can be reproduced for audit and appeal.

## Payout Simulation Baseline

Payout simulation should:

- apply explicit threshold and cap parameters
- produce a reasoned output with reason codes
- preserve `basis_risk_flag` and `requires_manual_review` when mismatch risk is detected

## Basis-Risk Treatment

Basis risk is the gap between measured index conditions and realized participant loss.
Where this gap is likely or evidenced, decision artifacts should set:

- `basis_risk_flag = true`
- `requires_manual_review = true`

In such cases, automated output is not final disposition.
The appeal and review pathway must remain available.

## Fallback Workflow

Fallback applies when source quality or mismatch risk is high:

1. Mark decision as `REVIEW_REQUIRED`.
2. Open or link an `AppealCase`.
3. Attach additional supporting evidence.
4. Record reviewer override or confirmation with explanation.
5. Publish final transparent outcome status.

## Normative References

The following references support the design constraints above:

- World Bank (2022): index insurance benefits and basis-risk limitations.
- World Bank (2019): implementation viability and risk controls.
- Nature Food (2024): climate resilience pathway pressure in wine regions.
- MEPA (2023): real-world climate-shock support operations.
- Rural Development Agency (2025): programmatic agroinsurance context.

See [Bibliography](research/bibliography.md) and [Evidence Matrix](research/evidence-matrix.md).
