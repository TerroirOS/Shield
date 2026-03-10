# Governance and Controls

Status: Planned / not launched.

## Governance Objectives

- Transparent and reproducible decisions.
- Clear accountability for exceptions and overrides.
- Separation between public transparency outputs and protected participant records.

## Required Governance Flags

Decision artifacts include:

- `rule_version`
- `basis_risk_flag`
- `requires_manual_review`
- `appeal_window_days`

## Access Model (Planned)

- Public users: can read non-sensitive report outputs.
- Program operators: can evaluate triggers and produce decisions.
- Reviewers/governance roles: can resolve appeals and overrides.

## Control Points

1. Source admissibility checks for event ingestion.
2. Rule version pinning for evaluation reproducibility.
3. Manual-review gating when mismatch risk is elevated.
4. Appealable finalization with documented rationale.
5. Aggregated public reporting with privacy boundaries.

## Privacy Boundary

Public reporting should avoid direct exposure of personal identifiers and sensitive operational details.
Protected records remain in restricted operational scope.
