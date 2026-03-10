# ADR-002: Trigger Model and Basis Risk

- Status: Accepted
- Date: 2026-03-10

## Context

Parametric or index-based logic can accelerate response but can diverge from realized field losses.
This basis-risk gap can create disputes if automation is treated as final without governance safeguards.

## Decision

Trigger and payout outputs must include explicit governance flags:

- `rule_version`
- `basis_risk_flag`
- `requires_manual_review`
- `appeal_window_days`

When basis-risk indicators are present, results are review-gated and appeal-capable.

## Consequences

- Preserves operational speed while retaining dispute safeguards.
- Improves auditability and reproducibility of outcomes.
- Increases implementation complexity by adding review workflow requirements.

## References

- World Bank (2022).
- World Bank (2019).
- Nature Food (2024).
