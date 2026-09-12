# Demo data and production verification

Keep Them Home defines six clearly synthetic scenarios in `server/demo/scenarios.ts`. They are presentation fixtures, not real shelter cases, outcomes, success rates, or evidence. Only Luna has full housing-solver support; Max, Bella, Milo, Daisy, and Rocky are display-context fixtures for supported UI demonstrations.

## Persistence policy

There is no designated Clerk demo owner and the current user-owned tables have no synthetic-data marker. For that reason, `pnpm db:seed:demo` intentionally writes **zero rows**. It verifies database connectivity and the presence of the user, pet, and case tables, then reports the synthetic manifest. Repeated runs are idempotent and cannot attach data to a real user.

Demo Mode uses ephemeral client/session state. Reset Demo clears that client state. No backend deletion endpoint exists or is needed.

## Schema and seed audit

- Migration `0000_known_mephisto.sql` creates `cases`, `case_factors`, and `outcomes` for persistent case data.
- Migration `0001_next_vulture.sql` creates `resources`, `interventions`, `intervention_resources`, and `recommendations` for curated support data and deterministic recommendation snapshots.
- Migration `0002_chilly_eternity.sql` adds Clerk-backed `users` and owner-scoped `pets`, then links cases to both.
- Drizzle records applied migration hashes in `drizzle.__drizzle_migrations`; production verification requires at least these three migrations.
- `users`, `pets`, `cases`, `case_factors`, `outcomes`, and `recommendations` can contain real user-derived data and are never touched by the demo seed.
- `resources`, `interventions`, and `intervention_resources` contain curated application catalog data and are managed only by the separate resource seed.
- The schema has no metadata or source field that can safely label an entire pet or case synthetic. No schema change was justified for an ephemeral judging demo.

The existing `pnpm db:seed` command is separate. It upserts the eight curated resources and five intervention definitions by their unique `slug` and `key`, then upserts join-table weights by its composite primary key. It never truncates user data.

## Safe production sequence

Do not paste a production connection string into source code or shell history. Prefer setting `DATABASE_URL` in the process environment through your secret manager. If loading a local file that may contain shell characters such as `&`, do not `source` it. Use a dotenv-capable runner or copy only the value into a securely quoted environment variable.

```sh
pnpm db:migrate
pnpm db:seed
pnpm db:seed:demo
pnpm db:verify:production
```

Run the commands against a preview branch first. `db:verify:production` is read-only: it checks all expected tables, eight visible resources, deterministic recommendation ranking, evidence selection, Luna solver output, Smallest Unlock, hypothetical immutability, and repeated-read determinism. It does not bypass Clerk or create a session, user, pet, case, outcome, or recommendation.

## Environment variables

- `DATABASE_URL`: required by migration, seed, and database verification commands; server-only and fails with a bounded configuration error when absent.
- `VITE_CLERK_PUBLISHABLE_KEY`: public browser configuration. When absent, saved-plan UI remains unavailable while anonymous assessment continues.
- `CLERK_SECRET_KEY`: server-only. When absent, protected routes return 401.
- `CLERK_PUBLISHABLE_KEY`: server-side Clerk verification key; the server falls back to the public Vite Clerk key when necessary.
- `CLERK_AUTHORIZED_PARTIES`: optional comma-separated origin allowlist; strongly recommended in production.
- `GROQ_API_KEY` and `GROQ_MODEL`: server-only and required together for extraction/generated explanations. Missing values produce bounded unavailable responses; deterministic guided intake and explanation fallback remain available.

Never create a fake Clerk identity, attach synthetic cases to arbitrary users, represent these scenarios as historical outcomes, or insert demo scenarios into the evidence catalog.
