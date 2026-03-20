# Workspace Boundaries

Status: Active for v1 implementation.

Shield is intentionally split into deployable apps and reusable packages. Day 3 establishes the allowed dependency graph and an automated audit so workspace coupling stays explicit as the repo grows.

## Allowed Dependency Graph

- `@terroiros/domain`: no internal workspace dependencies
- `@terroiros/connectors`: may depend only on `@terroiros/domain`
- `@terroiros/ui`: no internal workspace dependencies
- `@terroiros/shield-api`: may depend only on `@terroiros/domain` and `@terroiros/connectors`
- `@terroiros/shield-worker`: no internal workspace dependencies
- `@terroiros/shield-dashboard`: may depend only on `@terroiros/ui`

## Boundary Rules

- Cross-workspace imports must use the published package name, never relative filesystem paths.
- Workspace packages should be consumed through their root export only; subpath imports are intentionally blocked until those exports are designed and versioned.
- Apps must not import from other apps.
- Shared business logic belongs in `packages/domain`.
- External system adapters belong in `packages/connectors`.
- Shared presentational primitives belong in `packages/ui`.
- Runtime orchestration, persistence, and transport concerns stay inside the owning app workspace.

## Enforcement

Run `npm run audit:boundaries` from the repo root.

The audit checks:

- each workspace package declares only the internal dependencies it is allowed to use
- source files do not escape their own workspace with relative imports
- source files do not import undeclared or disallowed internal packages
- source files do not use internal subpath imports

`npm run build` and `npm test` now execute the boundary audit before their normal work so dependency drift is caught early.
