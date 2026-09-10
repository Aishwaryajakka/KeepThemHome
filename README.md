# Keep Them Home

Keep Them Home is a React/Vite pet surrender-prevention navigator. The frontend keeps an immediate reducer and `sessionStorage` copy of an assessment while optionally synchronizing cases, structured factors, outcomes, and deterministic plans through Vercel functions to Neon PostgreSQL.

## Local development

Requirements: Node.js 20 or newer and pnpm.

```sh
pnpm install
pnpm dev
```

Validation commands:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Neon database and Vercel API

1. Create a PostgreSQL project in Neon.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to the Neon connection string. Never use a `VITE_` prefix.
3. Generate migrations after intentional schema changes with `pnpm db:generate`.
4. Apply committed migrations with `pnpm db:migrate`.
5. Seed the reviewed resource and intervention catalog with `pnpm db:seed`.
6. Run `pnpm dev` for the frontend. Use `vercel dev` when testing the complete frontend and Vercel function stack locally.
7. Add `DATABASE_URL` to the appropriate Development, Preview, and Production environments in Vercel.
8. Deploy through Vercel and verify the API in that environment. A local build does not constitute a tested deployment.

The API supports cases, structured factors, reported outcomes, active verified resources, and deterministic Housing plans. Database failures do not block the assessment: `sessionStorage` remains the local resilience layer, and the Housing plan retains its local Product Pass 3 resource matcher as a fallback.

## Verified resources and deterministic plans

The catalog seed uses stable resource slugs and intervention keys. It updates existing metadata and relationships without creating duplicate records:

```sh
pnpm db:seed
```

`GET /api/resources` returns only active, verified resources and accepts an optional `category` filter. `POST /api/cases/:id/plan` reads persisted structured Housing facts, applies inspectable integer scoring rules, returns reason codes and linked resources, and persists a recommendation snapshot without duplicating an unchanged plan.

With a disposable development database configured, the following command creates temporary verification rows, tests resource visibility and repeat plan generation, and cleans up the temporary data:

```sh
pnpm db:verify
```

The eight verified resource records remain in `src/data/resources.ts` as the offline/demo fallback and seed source. Their factual content, URLs, verification date, and local matching behavior are unchanged.

## Retention Path Solver

The server-side Retention Path Solver answers which distinct Housing strategies could keep a pet with its owner. Source-controlled path definitions declare ordered intervention steps and explicit preconditions. Persisted case fields and structured factors are normalized into known-true, known-false, or unknown constraints before the pure deterministic solver runs.

Path states have strict meanings:

- `FEASIBLE`: every applicable modeled requirement is explicitly satisfied.
- `CONDITIONAL`: no requirement conflicts, but at least one required fact or availability value is unknown.
- `BLOCKED`: a known case fact conflicts with an explicit requirement.

Ranking favors feasible over conditional over blocked paths, then goal alignment, lower disruption, fewer unknowns, and fewer conflicts. Catalog order is the deterministic final tie-break. `POST /api/cases/:id/paths` derives results only from the persisted case, and verified resources attach beneath matching intervention steps. A resource or directory never proves service availability, eligibility, or path feasibility.

The solver exposes structured blockers for future use, but it does not calculate counterfactual changes or a “Smallest Unlock.” That work is intentionally reserved for Pass 7.
