# Stationery Inventory

An inventory for a stationery stash. You name the places your stationery lives, log each item with its type, place and state, and browse your places as tabs in a cozy video-game inventory screen. This is the final project for MPCS 51238. The project proposal is a static page at `public/proposal/index.html`, served at `/proposal`.

- Design: [docs/superpowers/specs/2026-11-16-stationery-inventory-v1-design.md](docs/superpowers/specs/2026-11-16-stationery-inventory-v1-design.md)
- Build plan: [docs/superpowers/plans/2026-11-16-stationery-inventory-v1.md](docs/superpowers/plans/2026-11-16-stationery-inventory-v1.md)

## Data model

Two tables. `user_id` is the Clerk user ID from the session token. The app never sends it.

**`places`**: one row per place a person keeps stationery.

| column | type | holds |
|---|---|---|
| `id` | `bigint generated always as identity primary key` | the place's own number |
| `user_id` | `text not null default (auth.jwt() ->> 'sub')` | whose place it is |
| `name` | `text not null` | trimmed, 1 to 40 characters, unique per person ignoring case |
| `created_at` | `timestamptz not null default now()` | tabs are ordered by this |

**`items`**: one row per stationery item.

| column | type | holds |
|---|---|---|
| `id` | `bigint generated always as identity primary key` | the item's own number |
| `user_id` | `text not null default (auth.jwt() ->> 'sub')` | whose item it is |
| `place_id` | `bigint not null references places(id) on delete restrict` | where it is |
| `name` | `text not null` | trimmed, 1 to 80 characters |
| `kind` | `text not null` | `notebook`, `pen`, `pencil` or `highlighter` |
| `state` | `text not null default 'unused'` | `unused`, `in_use` or `used_up` |
| `created_at` | `timestamptz not null default now()` | drives "Waiting N days" |

Row-level security is on for both tables. Signed-in people (`authenticated`) can select, insert, update and delete only rows whose `user_id` matches the token's `sub`. An item's insert and update also require that `place_id` is one of that person's own places. Signed-out visitors (`anon`) have no policies and no privileges. `supabase/migrations/*_restrict_inventory_grants.sql` revokes `TRUNCATE`, `REFERENCES` and `TRIGGER`, which row-level security doesn't cover.

## Rules

- **Keys live only in `.env.local`, which the student writes.**
  - Never read, print or search a `.env` file by any means. The deny rule in `.claude/settings.json` blocks the Read tool, and `cat`, `grep`, `head` and the like are just as off-limits.
  - No Supabase secret or service-role key is used anywhere.
- **Queries on `places` and `items` never filter by `user_id` in code.** Row-level security does that, and the Playwright privacy test only proves something because of it.
- **Read the docs first.** Before writing Next.js routing, auth gating, server actions or caching code, read the matching guide in `node_modules/next/dist/docs/`.
- **`/proposal` keeps working.** It is the submitted proposal link.
- **Commits and pushes.** Commit and push only when the student says so.

## Commands

- `npm run build`: production build. `next dev` fails in the course sandbox, so check with `rm -rf .next && npm run build`, then `npx next start -p 3000 -H 127.0.0.1`.
- `npm run lint`: ESLint
- `npm test`: library tests with `node --test` (tests in `tests/*.test.mjs` import `lib/*.ts` directly, so `lib/` uses only erasable TypeScript: no `enum`, no parameter properties)
- `npm run e2e`: the Playwright privacy test in `e2e/`. It builds and starts its own app on port 3100 and signs in the two Clerk test users named by `E2E_USER_A_EMAIL` and `E2E_USER_B_EMAIL` in `.env.local`.

### Installing packages on the IMC network

Public npm is blocked there. Install through IMC's mirror with per-command settings only, and never change `~/.npmrc`:

```bash
npm_config_registry=https://imc-npm-proxy.trading.imc.intra/repository/npm-proxy/ NODE_USE_SYSTEM_CA=1 npm install <package>
```

Then point the lockfile back at the public registry, so Vercel and classmates can install. The tarballs and checksums are identical:

```bash
sed -i '' 's#https://imc-npm-proxy.trading.imc.intra/repository/npm-proxy/#https://registry.npmjs.org/#g' package-lock.json
grep -c 'imc-npm-proxy' package-lock.json   # must print 0
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
