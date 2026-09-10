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

## Counterfactual Explorer and Smallest Unlock

For a conditional or blocked retention path, the Counterfactual Explorer can test a bounded catalog of supported hypothetical changes. It never accepts arbitrary fields or values from the browser. Supported dimensions currently cover goal flexibility and the modeled Housing requirements for complaint resolution, behavior mitigation, temporary care, underlying-issue resolution, pet-friendly housing, and move requirements.

The search reuses the Retention Path Solver as its only feasibility decision-maker. It checks one-change combinations first, then two, then three, and stops at the first cardinality that makes the selected path feasible. Equal-cardinality results are ordered by total burden and then stable change-code order. Resource listings can support investigation but never satisfy an availability requirement.

Applying an unlock changes only in-memory exploration state and requests a recomputation with trusted change codes. It does not patch the case or its factors. “Reset to current situation” discards those codes and recomputes from persisted facts. Counterfactual search is limited to three changes; unsupported paths return no modeled unlock instead of invented advice.

Natural-language intake and computation-first explanations are documented below.

## Retention Path Solver

The server-side Retention Path Solver answers which distinct Housing strategies could keep a pet with its owner. Source-controlled path definitions declare ordered intervention steps and explicit preconditions. Persisted case fields and structured factors are normalized into known-true, known-false, or unknown constraints before the pure deterministic solver runs.

Path states have strict meanings:

- `FEASIBLE`: every applicable modeled requirement is explicitly satisfied.
- `CONDITIONAL`: no requirement conflicts, but at least one required fact or availability value is unknown.
- `BLOCKED`: a known case fact conflicts with an explicit requirement.

Ranking favors feasible over conditional over blocked paths, then goal alignment, lower disruption, fewer unknowns, and fewer conflicts. Catalog order is the deterministic final tie-break. `POST /api/cases/:id/paths` derives results only from the persisted case, and verified resources attach beneath matching intervention steps. A resource or directory never proves service availability, eligibility, or path feasibility.

The solver exposes structured blockers to the separate deterministic Counterfactual Explorer; neither decision system is delegated to a language model.

## Natural-language intake

The optional story field sends only the submitted text to `POST /api/intake/extract`. The server reads `GROQ_API_KEY` and `GROQ_MODEL` from its environment, requests strict JSON-schema Structured Outputs, and then independently validates the result with Zod. Neither variable may use a `VITE_` prefix or be exposed to browser code.

Groq is used only as a structured parser. It may identify explicitly stated supported case facts, but it does not determine feasibility, rank paths, choose interventions, diagnose an animal, generate safety guidance, or recommend resources. Unstated facts remain `null`; application code selects a small number of existing guided follow-up questions, and confirmed facts merge into the existing assessment state and case-factor synchronization.

If configuration, the provider, parsing, or validation fails, the guided intake remains available and no partial extraction is committed. Raw owner stories and model responses are not persisted.

## Multi-factor case model

The guided intake accepts multiple controlled factors and then records one explicit primary barrier. Every other selected factor is retained in stable order as a contributing barrier; the primary is never duplicated in that list. Housing and Behavior use the existing detailed pathways, while Money, Veterinary/pet health, Temporary crisis, Time/capacity, and Family/life change are preserved as structured context without pretending that the Housing solver deeply supports them.

Behavior supports multiple owner-selected concerns followed by the existing deterministic seriousness, prior-help, and access-barrier questions. Selecting a cost barrier to behavior help also records the existing cost constraint. Aggression-related concerns still route through the deterministic seriousness question, and the canonical “Safety comes first” notice remains application copy rather than generated text.

Pass 8 extractions merge into the same selected, primary, contributing, Behavior, Housing, cost, urgency, and goal fields. Null values do not erase known answers, existing explicit user choices win, and duplicates are removed. Session version 2 migrates valid version-1 cases by deriving the selected-factor and Behavior-concern arrays from their existing fields. Multiple factors use the existing `case_factors` table with stable factor keys; no new questionnaire table is required.

## Computation-first explanations

`POST /api/cases/:id/explain` accepts only a supported path key, explanation mode, and optional supported what-if codes. The server reloads persisted facts and reruns the Retention Path Solver and Counterfactual Explorer; the browser cannot supply a status, rank, blocker, or Smallest Unlock. Only recomputed results and resources already attached by the verified catalog enter the grounded payload.

Groq explains this payload using strict structured output followed by Zod validation and deterministic checks for status, hypothetical state, resource names, and URLs. What-if explanations must remain explicitly hypothetical. If configuration, generation, or validation fails, deterministic prose is returned while path cards, blockers, resources, and counterfactual controls remain usable.

Generated prose never replaces or rewrites the deterministic Behavior safety notice. Groq is explanation-only: it does not calculate feasibility, ranking, blockers, resource scores, or Smallest Unlock, and it receives no raw owner story.
