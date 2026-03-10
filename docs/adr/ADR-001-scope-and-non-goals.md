# ADR-001: Scope and Non-goals

- Status: Accepted
- Date: 2026-03-10

## Context

Shield requires a clear boundary at documentation stage to avoid implementation ambiguity.

## Decision

This repository's first release is documentation-first and spec-first.
It defines architecture, lifecycle, governance, and integration contracts.
It does not include production runtime services.

## Non-goals

- Shipping production payout execution systems.
- Replacing regulated insurance frameworks.
- Claiming launch readiness.

## Consequences

- Enables aligned implementation across teams.
- Reduces premature architecture drift.
- Keeps risk communications accurate for stakeholders.
