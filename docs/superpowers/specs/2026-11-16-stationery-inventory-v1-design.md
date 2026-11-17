# Stationery Inventory v1: design

Due Tuesday, November 17, 2026, at 5:30 PM (handout: `Design, Build, Ship - Project v1 (draft).pdf`).
The proposal is live at https://final-project-51238-basunikita.vercel.app/proposal.

## Intent

The core task, in Nikita's words: Isha should be able to create the locations for her items, log
what items are where and what state they are in, and then browse through her list of places to see
where her items are.

That is the inventory itself. Everything else in the proposal (the duplicate check, moving with an
animation, ratings, illustrations) sits on top of it, so v1 is this loop, done well:

1. **Set up places.** Name the places your stash lives in.
2. **Log items.** For each item: its name, its type, which place it's in, and its state.
3. **Browse.** Click through the places as tabs and inspect what's in each one.

The project's focus is Design, so graders hold the interface to a higher standard. v1 is small, but
it must look and feel finished: the cozy video-game inventory screen from the proposal, not a form
over a table.

Isha tests v1 before class on November 17 and is not shown how to use it. Nikita also signs up and
logs a real stash.

## Goals

- A new person can open the live link, sign up, set up places, log items and browse them, with no
  help.
- The screens carry the proposal's look (see Visual design).
- Each person's stash is private: row-level security, proven by a test.
- `/proposal` keeps working at the same URL.

## Non-goals (they wait for v2)

- **Full stationery details per type** (size, ruling, binding, nib, ink and so on). Nikita: "v2 can
  have more complete drafts of stationery details."
- **"Do I already have this?"** It needs details, and a full stash, to be useful.
- **A "Move to…" button and its animation.** In v1 an item changes place through its edit form.
- **Feel ratings.**
- **Illustrated places, item art beyond the four icons, and animations.** Motion isn't installed
  yet.

## Anti-goals

- It feels like a spreadsheet or an admin panel.
- Anyone can see, change or delete someone else's places or items.
- The proposal page breaks or moves.

## Data model

Two tables in Supabase Postgres. `user_id` is the Clerk user ID taken from the session token, never
sent by the app, as in Assignment 4.

**`places`**

| column | type | notes |
|---|---|---|
| `id` | `bigint generated always as identity primary key` | |
| `user_id` | `text not null default (auth.jwt() ->> 'sub')` | |
| `name` | `text not null` | trimmed, 1 to 40 characters, unique per person ignoring case |
| `created_at` | `timestamptz not null default now()` | tabs are ordered by this |

**`items`**

| column | type | notes |
|---|---|---|
| `id` | `bigint generated always as identity primary key` | |
| `user_id` | `text not null default (auth.jwt() ->> 'sub')` | |
| `place_id` | `bigint not null references places(id) on delete restrict` | |
| `name` | `text not null` | trimmed, 1 to 80 characters |
| `kind` | `text not null` | `notebook`, `pen`, `pencil` or `highlighter` (check constraint) |
| `state` | `text not null default 'unused'` | `unused`, `in_use` or `used_up` (check constraint) |
| `created_at` | `timestamptz not null default now()` | drives "waiting X days" |

Row-level security is on for both tables. Signed-in people (`authenticated`) can select, insert,
update and delete only rows whose `user_id` matches the token's `sub`. An item's insert and update
checks also require that `place_id` is one of that person's own places, so nobody can file an item
into someone else's place by guessing an ID. `anon` gets no policies and no privileges. Grants are
trimmed to match the policies, and `truncate` is revoked, as in Assignment 4.

A place with items in it can't be deleted (`on delete restrict`). The app says so: "Move or delete
the 3 items in Bookshelf first." There are no bulk move or bulk delete actions in v1. *(My call.)*

## Screens and flows

**Signed out (`/`).** The proposal's hero in the app: the name, the one-line description, the
inventory-slot icons, and "Sign up" and "Sign in" buttons. Clerk's hosted sign-in and sign-up live at
`/sign-in` and `/sign-up`, with Clerk's `appearance` matched to the app's colours and fonts.

**First visit (no places yet).** A welcome panel asks "Where does your stash live?" It offers Work
backpack, Home desk and Bookshelf as one-tap suggestions and a field to type your own, like "my
room". Each one you add shows up as a tab right away. "Start logging" goes to the inventory once
there's at least one place.

**Inventory (`/inventory`).** This is layout B from the proposal, "list + inspect", as in the
proposal's demo:

- **Place tabs** run along the top, each showing its item count, with a **"+" tab** at the end.
  The "+" tab is Nikita's flow: it opens a small form to name the new place, and saving adds a tab
  and selects it.
- **The list** shows the selected place's items: icon, name, type and a NEW tag on unused items.
  Hovering, focusing or clicking a row selects it.
- **The inspect panel** shows the selected item: a large icon, name, type, place and state. Unused
  items also show NEW and "Waiting 12 days" (days since `created_at`; "Waiting since today" on day
  0). The panel has "Edit" and "Delete".
- **"Add item"** sits with the list. Its form asks for a name, a type (four icon buttons) and a state
  (unused by default). The place is the selected tab, which is how v1 provides the proposal's
  "default place". After saving, the new item is selected in the list.
- **Edit** changes the name, type, state and place (a select of your places). Changing the place
  moves the item: it leaves the list and the tab counts update.
- **Delete** asks first ("Delete Mnemosyne A5 Spiral?") and can't be undone.
- **Places** can be renamed, and deleted when empty, from a small menu on the selected tab.

**States to design:** loading; a new account with no places (the welcome panel); an empty place
("Nothing here yet" plus Add item); a name that's empty or too long; a place name already used;
"Couldn't save. Try again." with the typed values kept; and "Your session ended. Sign in again."

**Phone width (375 px and up).** The tabs scroll sideways, the list is full width, and selecting an
item shows the inspect panel under the list with a "Back to list" link. There's no sideways page
scroll.

**Accessibility.** The tabs use `role="tab"` with arrow-key movement. Every control works by
keyboard with a visible focus ring, form fields have labels, errors are announced, and the
item icons have text names.

## Visual design

Carry over the proposal page's system, which lives in `proposal/index.html`:

- **Colour tokens:** ink `#3b2f3a`, cream `#fff6e6`, paper `#fffdf8`, slot `#f3e6cf`, slot edge
  `#e2cfae`, blush `#f7cfc8`, mint `#cfe9da`, butter `#fff2c9`, gold `#f5a524`, muted `#6f5f6a`,
  focus `#4f7fc4`. Define them as Tailwind theme colours.
- **Type:** Fredoka 600 for headings, tabs, buttons, badges and item names in lists, and Nunito for
  body text. Load both through `next/font/google`. Nikita doesn't want pixel fonts.
- **Shapes:** "window" panels with a 3 px ink border, rounded corners and a solid ink drop shadow;
  2 px ink borders on controls; the dotted graph-paper page background; and the gold bobbing NEW
  badge (still when reduced motion is set).
- **Icons:** the proposal's inline SVG symbols, with one per type in v1: notebook (`i-nb-spiral`),
  pen (`i-gel`), pencil (`i-pencil`) and highlighter (`i-highlighter`).

## Constraints

- **Repository:** the same repo, `basunikita/final-project-51238-basunikita`, in the local folder
  `project-proposal-51238-basunikita/`. The app takes over `/`. The proposal moves to
  `public/proposal/index.html`, unchanged, and a rewrite in `next.config.ts` serves it at `/proposal`.
  `vercel.json`'s redirect from `/` is removed.
- **Vercel:** the project was imported with the "Other" preset for the static page. Nikita switches
  it to Next.js and adds the environment variables before the first app deploy. Assignment 3's first
  deploy failed for this reason.
- **Stack:** the same versions as Assignment 4: Next.js 16.4.2, React 19.3.0, Tailwind 4,
  `@clerk/nextjs` 7.9.18, `@supabase/supabase-js` 2.118.0, and Playwright 1.64.1 with
  `@clerk/testing`. Data access follows `lib/supabase-server.ts` there: server-side, with the
  visitor's Clerk token passed as `accessToken`.
- **Rules from Assignment 4's AGENTS.md, which this repo gets a copy of:**
  - Keys live only in `.env.local`, which Nikita writes. No agent reads `.env*` (the deny rule goes
    in `.claude/settings.json`).
  - No Supabase secret or service-role key is used anywhere.
  - Queries never filter by `user_id` in code. Row-level security does that.
  - Read `node_modules/next/dist/docs/` before writing routing, auth, server action or caching code.
  - Install npm packages through IMC's mirror with per-command settings, then rewrite the lockfile
    to the public registry.
  - Commit and push only when Nikita asks.
- **Sandbox:** `next dev` fails here, so check builds with `next build` and `next start`, on
  `127.0.0.1`.
- **Free tiers only:** Supabase Free, Clerk Free and Vercel Hobby, with usage alerts on where
  offered. No model calls.
- **Time:** about 24 hours, and Isha's test has to come before 5:30 PM on November 17. Deploy as
  soon as sign-in works, so there's a live link from the first slice.

## Order of work

1. Scaffold Next.js in the repo, move the proposal under `public/`, and deploy. `/` and `/proposal`
   both work live.
2. Clerk sign-in and sign-up, deployed.
3. Tables, row-level security and grants, through the Supabase MCP server's `apply_migration`.
4. Places: the first-visit panel, tabs and the "+" tab.
5. Items: add, list, inspect, edit (including place and state) and delete.
6. States, phone width and accessibility, finished and checked. Steps 4 and 5 are built to work at
   phone width from the start, because Isha may test on a phone. *(My call.)*
7. Before shipping: the Playwright privacy test (person B can't see person A's places or items), a
   check that no keys are in the repo, `/security-review`, and an agent walkthrough as a new person.
   All of this passes before Isha logs a real stash. *(My call.)*
8. After Isha's test: the v2 plan, in `docs/v2-plan.md` and linked from the README.

If time runs short, cut features in this order: renaming and deleting places, then item delete,
then editing anything except state and place. States, phone width, accessibility and the privacy
test are never cut, because the focus is Design and the stash is private. *(My call.)*

## Left to the builder

Component structure, server actions or route handlers, how the selected tab and item live in the
URL, the exact wording of the copy, and test layout.

## Accounts

Decided: v1 gets **a new Clerk app and a new Supabase project**, both named Stationery Inventory.
Assignments 4 and 5 share a Clerk app whose name would appear on the sign-up card and in the
verification email, which could confuse Isha in an unaided test. Supabase Free allows two active
projects, and these assignments use one.

Nikita sets them up in the dashboards:

1. Create the Supabase project (Free) and the Clerk app (Free, email sign-in).
2. Connect them: add Clerk as a third-party auth provider in Supabase, and turn on Clerk's Supabase
   integration.
3. Write the keys into `.env.local` and into the Vercel project's environment variables.
4. Create two Clerk test users for the privacy test, `E2E_USER_A_EMAIL` and `E2E_USER_B_EMAIL`.
5. Point the Supabase MCP server at the new project for this repo, as in Assignment 4.
