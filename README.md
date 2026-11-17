# Stationery Inventory

For stationery lovers who keep buying notebooks they already own: see everything you have, where it lives, and what's still waiting to be used.

- **Live app:** https://final-project-51238-basunikita.vercel.app
- **Project proposal:** https://final-project-51238-basunikita.vercel.app/proposal
- **v2 plan:** [docs/v2-plan.md](docs/v2-plan.md)

This is my final project for MPCS 51238, Design, Build, Ship. Its focus is Design.

## What v1 does

The core task: create the places your stationery lives, log which items are where and what state they're in, and browse your places to see where everything is.

1. **Set up places.** A new account starts on "Where does your stash live?", with Work backpack, Home desk and Bookshelf as one-tap suggestions and a field for your own, such as "My room".
2. **Log items.** Each item has a name, a type (notebook, pen, pencil or highlighter), a place and a state (unused, in use or used up). Adding an item files it into the tab you're on.
3. **Browse.** Places are tabs with item counts. Each tab lists its items, and hovering over or picking one shows it large in the inspect panel, like a video-game inventory. Unused items wear a NEW badge and say how long they've been waiting.

You can also add places from the "+" tab, rename or delete an empty place, edit an item (including moving it to another place), and delete an item.

## Privacy

Every person's places and items are private. Accounts are Clerk's. Data lives in two Supabase tables, `places` and `items`, with row-level security. A signed-in person can read and change only rows whose `user_id` matches their Clerk session token, and an item can only be filed into one of their own places. Signed-out visitors get nothing. The app never sends a `user_id` and never filters by one; the database does it. The Playwright test in `e2e/privacy.spec.ts` signs in two test users and checks that neither can see the other's places or items, even by putting the other's IDs in the URL.

The full data model is in [AGENTS.md](AGENTS.md).

## Running it

You need a Clerk app and a Supabase project connected to each other (Clerk as a third-party auth provider in Supabase).

1. Write `.env.local` with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. For the privacy test, also add `E2E_USER_A_EMAIL` and `E2E_USER_B_EMAIL`, two Clerk test users.
2. Run the files in `supabase/migrations/` in order, in the Supabase SQL editor.
3. `npm install`, then `npm run build` and `npm start`.

Checks: `npm test` (the inventory logic), `npm run lint`, and `npm run e2e` (the privacy test).

## Built with

Next.js 16, React 19, Tailwind CSS 4, Clerk, Supabase and Vercel, all on free tiers.

## How it was made

- Design: [docs/superpowers/specs/2026-11-16-stationery-inventory-v1-design.md](docs/superpowers/specs/2026-11-16-stationery-inventory-v1-design.md)
- Build plan: [docs/superpowers/plans/2026-11-16-stationery-inventory-v1.md](docs/superpowers/plans/2026-11-16-stationery-inventory-v1.md)
