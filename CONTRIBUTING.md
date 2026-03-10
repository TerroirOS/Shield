# Contributing

Thank you for contributing to Terroir Shield documentation and specifications.

## Scope

This repository currently hosts planned architecture and machine-readable specs.
Do not present content as production-ready implementation.

## Contribution Principles

- Preserve the planned-status language unless launch status changes.
- Keep normative claims source-backed.
- Prefer explicit, testable language in specs.
- Keep API and schema changes synchronized with docs.

## Workflow

1. Create a feature branch from `main`.
1. Update docs and specs together.
1. Run local validation:

```bash
npm install
npm run validate
```

1. Open a pull request using the PR template.

## Commit Guidance

Recommended commit categories:

- `docs:` for markdown changes
- `spec:` for API/schema/example changes
- `chore:` for CI/templates/tooling

## Citation Guidance

When you introduce normative design claims (for example thresholding behavior, basis-risk treatment, or data-source hierarchy), include references in:

- `docs/trigger-payout-logic.md`
- `docs/research/bibliography.md`
- `docs/research/evidence-matrix.md`

## Pull Request Checklist

- [ ] Planned/not-launched status language remains accurate.
- [ ] New interfaces documented in both markdown and OpenAPI/schema files.
- [ ] `npm run validate` passes.
- [ ] Links to local files resolve.
- [ ] Research references are added where claims are normative.
