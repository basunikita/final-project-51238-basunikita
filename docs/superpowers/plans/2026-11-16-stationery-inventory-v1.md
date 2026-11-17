# Stationery Inventory v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A live app where a new person signs up, sets up the places their stationery lives, logs items (name, type, place, state) and browses them as tabs in a cozy video-game inventory screen.

**Architecture:** Next.js App Router in the existing repo, with the proposal kept as a static file under `public/`. Clerk handles accounts. Data lives in two Supabase tables, read and written only on the server with the visitor's Clerk token, so row-level security does all per-person filtering. One client component owns the inventory screen and calls server actions.

**Tech Stack:** Next.js 16.4.2, React 19.3.0, Tailwind 4 (`@tailwindcss/turbopack`), `@clerk/nextjs` 7.9.18, `@supabase/supabase-js` 2.118.0, Playwright 1.64.1 with `@clerk/testing` 2.2.50, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-16-stationery-inventory-v1-design.md`

**Reference repo:** `/Users/nbasu/src/mpcs/51238/assignment-4-51238-basunikita/` ("A4"). Tasks say "copy from A4" for files that carry over unchanged in shape. Never read any `.env*` file there or here.

## Global Constraints

- Due Tuesday, November 17, 2026, at 5:30 PM. Isha tests before class that day, unaided.
- Item fields are exactly: name, type (`notebook`, `pen`, `pencil`, `highlighter`), place, state (`unused`, `in_use`, `used_up`). No other stationery details in v1.
- Place names: trimmed, 1 to 40 characters, unique per person ignoring case. Item names: trimmed, 1 to 80 characters.
- `/proposal` keeps serving the proposal page unchanged. The app owns `/`.
- Keys live only in `.env.local`, which Nikita writes. No agent reads `.env*` by any means. No Supabase secret or service-role key anywhere.
- Queries never filter by `user_id` in code. Row-level security does that.
- Read `node_modules/next/dist/docs/` before writing routing, auth gating, server actions or caching code.
- Install packages only through IMC's mirror with per-command settings, then rewrite `package-lock.json` to `https://registry.npmjs.org/` (see A4 AGENTS.md). Never change `~/.npmrc`.
- `next dev` fails in this sandbox. Check with `rm -rf .next && npm run build`, then `npx next start -p 3000 -H 127.0.0.1` as a background task, and test at `http://127.0.0.1:3000`.
- Colours: ink `#3b2f3a`, cream `#fff6e6`, paper `#fffdf8`, slot `#f3e6cf`, slot edge `#e2cfae`, blush `#f7cfc8`, mint `#cfe9da`, butter `#fff2c9`, gold `#f5a524`, muted `#6f5f6a`, focus `#4f7fc4`.
- Fonts: Fredoka 600 for headings, tabs, buttons, badges and list item names; Nunito for body text. No pixel fonts.
- Works at 375 px wide with no sideways page scroll.
- Commit only when Nikita says so, and push only when Nikita says so. Commit messages start with `v1:` and end with the `Co-Authored-By` line. Commits use `nbasu@uchicago.edu`, which the repo's local config already has.
- If time runs short, cut features in this order: renaming and deleting places, then item delete, then editing anything except state and place. States, phone width, accessibility and the privacy test are never cut.
- Fixed copy: "Where does your stash live?", "Start logging", "Nothing here yet", "Couldn't save. Try again.", "Your session ended. Sign in again.", "Waiting since today", "Waiting N days", "Move or delete the N items in PLACE first.", "Back to list".

## Review Focus

1. **Double-clicking a save button** (Add place, Add item, Save): one row is created, never two. Task 7 has an e2e test, and every submit button disables while its action is pending.
2. **A place name that differs only by case or spaces** (" bookshelf " when "Bookshelf" exists): a friendly "You already have a place called Bookshelf." message, never a crash or a raw database error. Task 3 has a unit test, and Task 4 maps Postgres `23505` to the same message.
3. **A stale or foreign ID in the URL** (`?place=999` or `?item=` of a deleted item or someone else's item): the screen falls back to the first place and its first item. Task 3 has unit tests for `resolveSelection`.
4. **A session that ends mid-action:** the action returns "Your session ended. Sign in again." and keeps the typed values. Task 3 has a unit test for `failureMessage`, and every action checks `auth()` first.
5. **Long or unbroken names** (a 40-character place, an 80-character item with no spaces) at 375 px: they wrap inside their tab, row or panel with no sideways scroll. This is checked by hand in Task 6, at 375 px with the longest names.

---

## File Structure

```
app/
  layout.tsx            ClerkProvider (appearance), fonts, metadata
  globals.css           Tailwind import, @theme tokens, the proposal's window/panel/btn/tab/badge styles
  page.tsx              signed-out home (hero + Sign up / Sign in)
  sign-in/[[...sign-in]]/page.tsx
  sign-up/[[...sign-up]]/page.tsx
  inventory/
    page.tsx            server: auth.protect(), loadInventory(), renders InventoryScreen
    actions.ts          server actions for places and items
    InventoryScreen.tsx client: selection, tabs, list, inspect, forms, messages
    WelcomePanel.tsx    first visit: suggested places and your own
    PlaceTabs.tsx       tabs with counts, the "+" tab, the selected tab's place menu
    ItemList.tsx        rows for the selected place, Add item
    InspectPanel.tsx    the selected item, Edit and Delete
    ItemForm.tsx        add and edit form (name, four type buttons, state, place)
  ui/
    ItemIcon.tsx        the four SVG icons, by kind
lib/
  inventory.ts          types, constants, validation, waiting label, counts, selection, row mapping
  inventory-server.ts   loadInventory()
  supabase-server.ts    copy from A4
  routes.ts             redirectsSignedOutVisitors() for /inventory
proxy.ts                Clerk middleware, from A4
public/proposal/index.html   moved from proposal/index.html, unchanged
supabase/migrations/    create_places_items.sql, restrict_inventory_grants.sql
tests/inventory.test.mjs, tests/routes.test.mjs
e2e/global.setup.ts, e2e/privacy.spec.ts
playwright.config.ts, next.config.ts, tsconfig.json, eslint.config.mjs, package.json
AGENTS.md, README.md, .claude/settings.json, .gitignore
```

---

### Task 1: The app shell, with `/proposal` still working

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (temporary "Stationery Inventory, coming soon" panel), `AGENTS.md`, `.claude/settings.json`
- Move: `proposal/index.html` → `public/proposal/index.html`
- Delete: `vercel.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run build`, `npm test`, `npm run lint`, `npm run e2e` scripts, the same as in A4.

- [ ] **Step 1: Copy the config from A4.** Copy `tsconfig.json`, `eslint.config.mjs` and `package.json`. Rename the package to `final-project-51238-basunikita`, and keep A4's exact dependency versions and scripts.
- [ ] **Step 2: Fix `.gitignore`.** Add A4's `/node_modules`, `/.next/`, `.env*` and `next-env.d.ts` lines. Change `.claude/` to `.claude/*` plus `!.claude/settings.json`, so the deny rule is committed. Then write `.claude/settings.json` as `{ "permissions": { "deny": ["Read(./.env)", "Read(./.env.*)"] } }`.
- [ ] **Step 3: Install packages through the IMC mirror.**
  - Run `npm_config_registry=https://imc-npm-proxy.trading.imc.intra/repository/npm-proxy/ NODE_USE_SYSTEM_CA=1 npm install`.
  - Then run `sed -i '' 's#https://imc-npm-proxy.trading.imc.intra/repository/npm-proxy/#https://registry.npmjs.org/#g' package-lock.json`.
  - Expected: `grep -c imc-npm-proxy package-lock.json` prints `0`.
- [ ] **Step 4: Write `next.config.ts`.** Start from A4's (`cacheComponents`, `partialPrefetching`, the turbopack CSS rule). Add `async rewrites()` that returns `[{ source: "/proposal", destination: "/proposal/index.html" }, { source: "/proposal/", destination: "/proposal/index.html" }]`.
- [ ] **Step 5: Move the proposal and remove the redirect.** Run `git mv proposal/index.html public/proposal/index.html` and `git rm vercel.json`.
- [ ] **Step 6: Write `AGENTS.md`.** Use A4's Rules, Commands and "Installing packages" sections, adapted:
  - Add a data-model section with the two tables from the spec.
  - Name the plan and spec.
  - Keep the Next.js agent-rules block.
- [ ] **Step 7: Build and check both routes.**
  - Run `rm -rf .next && npm run build`, then start `npx next start -p 3000 -H 127.0.0.1` in the background.
  - Check: `curl -s http://127.0.0.1:3000/proposal | grep -c 'Stationery Inventory · Project Proposal'` prints `1`.
  - Check: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/` prints `200`.
  - Check: `npm run lint` passes.
- [ ] **Step 8: Commit** with the message "v1: Next.js shell, proposal served from public/".
- [ ] **Step 9: Nikita's step.** Nikita switches the Vercel project's framework preset from "Other" to Next.js. Then Nikita says to push, and I push `main`. Check `https://final-project-51238-basunikita.vercel.app/proposal` and `/` live.

### Task 2: The look, the signed-out home, and Clerk sign-in

Needs Nikita's Clerk keys in `.env.local` and in Vercel (the spec's Accounts section).

**Files:**
- Create: `app/ui/ItemIcon.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`, `proxy.ts`, `lib/routes.ts`, `tests/routes.test.mjs`
- Modify: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

**Interfaces:**
- Produces:
  - `redirectsSignedOutVisitors(pathname: string, isServerAction: boolean): boolean`, true for `/inventory` and `/inventory/*` when it isn't a server action.
  - `<ItemIcon kind={Kind} className?: string title?: string />`.
  - The CSS classes `window`, `panel`, `btn`, `btn-primary`, `tab`, `tab-on`, `badge-new`.

- [ ] **Step 1: Write the failing route tests.** Write `tests/routes.test.mjs`, following A4's:
  - "opening /inventory signed out goes to sign-in": `redirectsSignedOutVisitors("/inventory", false) === true`, and the same for `"/inventory/x"`.
  - "a server action posted to /inventory answers for itself": `redirectsSignedOutVisitors("/inventory", true) === false`.
  - "the home page and /proposal stay public": `false` for `"/"` and for `"/proposal"`.
- [ ] **Step 2: Run them.** `npm test` should FAIL, because the module doesn't exist yet.
- [ ] **Step 3: Implement `lib/routes.ts` and `proxy.ts`.**
  - Copy `proxy.ts` from A4, with signed-in visitors at `/` redirected to `/inventory`.
  - Change the matcher's `art/` exclusion to `proposal`, so Clerk never runs on the static page.
- [ ] **Step 4: Run the tests again.** `npm test` should PASS.
- [ ] **Step 5: Write `app/globals.css`.**
  - Define `@theme` colours from the Global Constraints, named `ink`, `cream`, `paper`, `slot`, `slot-edge`, `blush`, `mint`, `butter`, `gold`, `muted` and `focus`.
  - Port these styles from `public/proposal/index.html`: `.window`, `.panel`, `.btn`, `.tab`, the NEW badge with its bob animation (off under `prefers-reduced-motion`), the dotted body background, and a `:focus-visible` ring in the focus colour.
  - Set `overflow-wrap: anywhere` on tab, row and panel text.
- [ ] **Step 6: Write `app/layout.tsx`.**
  - Load Fredoka (600) and Nunito (500, 700, 800) with `next/font/google`, as CSS variables.
  - Set the metadata title to "Stationery Inventory" and the description to the proposal's one-liner.
  - Configure `ClerkProvider` `appearance` with `variables`: `colorPrimary` ink, `colorBackground` paper, `colorText` ink, `fontFamily` Nunito, and `borderRadius` `14px`.
- [ ] **Step 7: Write `app/ui/ItemIcon.tsx`.** Port the proposal's SVG symbols as inline SVG: notebook from `i-nb-spiral`, pen from `i-gel`, pencil from `i-pencil` and highlighter from `i-highlighter`. Use `role="img"` and an accessible name equal to `KIND_LABELS[kind]` unless `title` is given.
- [ ] **Step 8: Write the home page and the sign-in pages.**
  - `app/page.tsx` is the proposal hero:
    - eyebrow "Stationery Inventory"
    - h1 "Stationery Inventory"
    - the lede "For stationery lovers who keep buying notebooks they already own: see everything you have, where it lives, and what's still waiting to be used."
    - four inventory slots with icons
    - `<Link>` buttons for "Sign up" (`/sign-up`) and "Sign in" (`/sign-in`)
  - The sign-in and sign-up pages are A4's, centred on the cream background.
- [ ] **Step 9: Build and check.**
  - Build and start as in Task 1.
  - Signed out, `/inventory` redirects to `/sign-in`.
  - Sign up with a fresh email at `http://127.0.0.1:3000/sign-up`. You land on `/inventory`, which 404s until Task 4.
  - `/` at 375 px has no sideways scroll.
- [ ] **Step 10: Commit** with the message "v1: the look, the home page and Clerk sign-in". Push when Nikita says so, and check sign-up on the live site.

### Task 3: Tables, row-level security and inventory logic

Needs the Supabase MCP server pointed at the new project. If this session doesn't have it, Nikita runs each migration file in the Supabase SQL editor, in order.

**Files:**
- Create: `supabase/migrations/<version>_create_places_items.sql`, `supabase/migrations/<version>_restrict_inventory_grants.sql`, `lib/supabase-server.ts` (copy from A4), `lib/inventory.ts`, `tests/inventory.test.mjs`
- Modify: `tsconfig.json` (add `"supabase"` to `exclude`)

**Interfaces:**
- Produces, from `lib/inventory.ts` (erasable TypeScript only, so `node --test` can import it):
  - `KINDS = ["notebook", "pen", "pencil", "highlighter"] as const`; `type Kind`
  - `STATES = ["unused", "in_use", "used_up"] as const`; `type ItemState`
  - `KIND_LABELS: Record<Kind, string>`: Notebook, Pen, Pencil, Highlighter
  - `STATE_LABELS: Record<ItemState, string>`: Unused, In use, Used up
  - `SUGGESTED_PLACES = ["Work backpack", "Home desk", "Bookshelf"]`
  - `type Place = { id: number; name: string; createdAt: string }`
  - `type Item = { id: number; placeId: number; name: string; kind: Kind; state: ItemState; createdAt: string }`
  - `type Checked = { ok: true; value: string } | { ok: false; message: string }`
  - `checkPlaceName(raw: string, existing: Place[], exceptId?: number): Checked`
  - `checkItemName(raw: string): Checked`
  - `isKind(v: unknown): v is Kind`; `isItemState(v: unknown): v is ItemState`
  - `waitingLabel(createdAt: string, now: Date): string`
  - `itemCounts(items: Item[]): Map<number, number>` (place ID → count)
  - `resolveSelection(places: Place[], items: Item[], params: { place?: string; item?: string }): { placeId: number | null; itemId: number | null }`
  - `deletePlaceBlockedMessage(placeName: string, count: number): string`
  - `type Fail = { ok: false; message: string }`
  - `SESSION_ENDED = "Your session ended. Sign in again."`; `SAVE_FAILED = "Couldn't save. Try again."`
  - `failureMessage(code: string | undefined): string` returns `SESSION_ENDED` for `"PGRST301"` (an expired token) and `SAVE_FAILED` for anything else.
  - `PLACE_COLUMNS = "id,name,created_at"`; `ITEM_COLUMNS = "id,place_id,name,kind,state,created_at"`; `placeFromRow(row)`; `itemFromRow(row)`
- Produces: `createServerSupabase(): Promise<SupabaseClient>`, from A4.

- [ ] **Step 1: Write the failing tests** in `tests/inventory.test.mjs`:
  - `checkPlaceName(" My room ", [])` gives `{ ok: true, value: "My room" }`.
  - `checkPlaceName("   ", [])` gives `{ ok: false, message: "Give the place a name." }`.
  - `checkPlaceName("x".repeat(41), [])` gives the message "Keep place names to 40 characters.". `"x".repeat(40)` is ok.
  - `checkPlaceName(" bookshelf ", [{ id: 1, name: "Bookshelf", createdAt: "…" }])` gives "You already have a place called Bookshelf.".
  - Renaming a place to its own name in different case is ok: `checkPlaceName("BOOKSHELF", [{ id: 1, name: "Bookshelf", … }], 1)` gives `ok: true`.
  - `checkItemName("")` gives "Give the item a name.". `checkItemName("x".repeat(81))` gives "Keep item names to 80 characters.". 80 characters is ok.
  - `waitingLabel(created, now)`:
    - "Waiting since today" for 0 and for 23 hours later
    - "Waiting 1 day" at 24 hours
    - "Waiting 12 days" at 12 × 24 hours plus 5 minutes
  - `resolveSelection`, with places 1 and 2 and items 10 and 11 in place 1 and item 20 in place 2:
    - `{}` gives `{ placeId: 1, itemId: 10 }`
    - `{ place: "2" }` gives `{ placeId: 2, itemId: 20 }`
    - `{ place: "999" }` gives `{ placeId: 1, itemId: 10 }`
    - `{ place: "1", item: "20" }` gives `{ placeId: 1, itemId: 10 }`, because the item isn't in that place
    - `{ place: "abc", item: "x" }` gives `{ placeId: 1, itemId: 10 }`
    - an empty place gives `itemId: null`
    - no places gives `{ placeId: null, itemId: null }`
  - `deletePlaceBlockedMessage("Bookshelf", 3)` gives "Move or delete the 3 items in Bookshelf first.". A count of 1 gives "Move or delete the 1 item in Bookshelf first.".
  - `itemCounts` counts per `placeId`.
  - `isKind("pen")` is true, and `isKind("eraser")` is false. `isItemState("in_use")` is true.
  - `failureMessage("PGRST301")` gives "Your session ended. Sign in again.". `failureMessage(undefined)`, `failureMessage("42501")` and `failureMessage("23514")` give "Couldn't save. Try again.".
- [ ] **Step 2: Run them.** `npm test` should FAIL.
- [ ] **Step 3: Implement `lib/inventory.ts`.**
  - The waiting label uses whole days: `Math.floor((now - created) / 86_400_000)`.
  - `resolveSelection` parses its params with `Number()` and only accepts IDs present in the arrays it's given.
- [ ] **Step 4: Run the tests again.** `npm test` should PASS.
- [ ] **Step 5: Write `create_places_items.sql`.**
  - Create the columns exactly as the spec's Data model tables give them.
  - Add these constraints:
    - `check (name = btrim(name) and char_length(name) between 1 and 40)` on places
    - `create unique index places_user_name_idx on public.places (user_id, lower(name))`
    - `check (name = btrim(name) and char_length(name) between 1 and 80)` on items
    - check constraints for `kind` and `state`
    - `create index items_user_place_idx on public.items (user_id, place_id)`
  - Enable RLS on both tables.
  - Policies, all `to authenticated`:
    - For places, one policy each for select, insert, update and delete, all on `(select auth.jwt() ->> 'sub') = user_id`.
    - For items, select and delete on the same condition.
    - For items, insert and update `with check` on the same condition plus `exists (select 1 from public.places p where p.id = place_id and p.user_id = (select auth.jwt() ->> 'sub'))`. Update also needs `using` on the owner condition.
  - Grant `select, insert, update, delete` on both tables to `authenticated`.
- [ ] **Step 6: Write `restrict_inventory_grants.sql`.** Revoke all from `anon` on both tables, and revoke `truncate, references, trigger` from `authenticated`. Name both files with the version Supabase records, as A4 does.
- [ ] **Step 7: Apply the migrations and check them.** Apply both with the MCP server's `apply_migration`. Then run its `get_advisors` with type `security`. Expected: no warnings about `places` or `items`.
- [ ] **Step 8: Copy `lib/supabase-server.ts` from A4 and add `"supabase"` to `tsconfig.json`'s `exclude`.**
- [ ] **Step 9: Run the full check.** `npm test` and `npm run build` should pass.
- [ ] **Step 10: Commit** with the message "v1: places and items tables with row-level security, inventory logic".

### Task 4: Places: first visit, tabs and the "+" tab

**Files:**
- Create: `lib/inventory-server.ts`, `app/inventory/page.tsx`, `app/inventory/actions.ts` (the place actions), `app/inventory/InventoryScreen.tsx`, `app/inventory/WelcomePanel.tsx`, `app/inventory/PlaceTabs.tsx`

**Interfaces:**
- Consumes: everything from `lib/inventory.ts` (Task 3), `createServerSupabase()`, and `ItemIcon`.
- Produces:
  - `loadInventory(): Promise<{ ok: true; places: Place[]; items: Item[] } | Fail>`. It orders places by `created_at, id` and items by `created_at, id`.
  - `addPlace(name: string): Promise<{ ok: true; place: Place } | Fail>`
  - `renamePlace(id: number, name: string): Promise<{ ok: true; place: Place } | Fail>`
  - `deletePlace(id: number): Promise<{ ok: true } | Fail>`
  - The selection lives in the URL as `?place=<id>&item=<id>`, updated with `router.replace` (no scroll).
  - `data-place-id` goes on each tab, and `data-item-id` on each list row (for Task 8).

- [ ] **Step 1: Write `loadInventory()` and the three place actions.**
  - Each action checks `auth()` first, then validates with `checkPlaceName` (against the person's current places), then writes.
  - Postgres `23505` becomes "You already have a place called NAME.". `23503` on delete becomes `deletePlaceBlockedMessage`. Anything else becomes `failureMessage(error.code)`, logged with `console.error`.
  - Server actions take only plain values, and they re-validate IDs with `Number.isInteger`.
- [ ] **Step 2: Write `app/inventory/page.tsx`.** It calls `await auth.protect()`, then `loadInventory()`, reads `searchParams`, and renders `<InventoryScreen places items initialPlaceId initialItemId />` using `resolveSelection`. When the load fails, it shows the message in a `window` panel with a "Try again" link.
- [ ] **Step 3: Write `WelcomePanel`.** It shows when there are no places:
  - the heading "Where does your stash live?"
  - one tap-to-add chip per `SUGGESTED_PLACES` entry that isn't already added
  - a labelled field "Add your own" with an Add button
  - the places added so far, shown as tabs
  - "Start logging", which is disabled until there is at least one place, and then shows the inventory
- [ ] **Step 4: Write `PlaceTabs`.**
  - `role="tablist"`, with each tab a `role="tab"` button showing the name and its count from `itemCounts`.
  - Left and Right arrows move focus and selection between tabs. Home and End jump to the first and last tab.
  - At the end, a "+" tab (`aria-label="Add a place"`) opens an inline name field. Saving adds the tab and selects it.
  - The selected tab has a small "⋯" menu with "Rename" (inline field) and "Delete". Delete is refused with the blocked message when the count is above 0, and otherwise asks "Delete PLACE?".
  - The tabs scroll sideways inside their own row at phone width.
- [ ] **Step 5: Write `InventoryScreen`.**
  - It holds `places`, `items`, `selectedPlaceId` and `selectedItemId` in state, starting from its props, and applies each action's result locally.
  - Each form shows its error with `role="alert"` next to the field, keeps the typed value, and disables its submit button while pending.
  - For this task, the list area shows "Nothing here yet" for every place. Task 5 fills it.
- [ ] **Step 6: Build and check it by hand.**
  - Sign up fresh, and the welcome panel shows.
  - Tap "Bookshelf" and type "My room". Two tabs appear.
  - Adding "bookshelf" shows the duplicate message.
  - "Start logging" shows the tabs.
  - The "+" tab adds "Small box". Rename it to "Pen box".
  - Delete "Pen box" (it's empty).
  - Refreshing keeps the selected tab. The arrow keys move between tabs.
- [ ] **Step 7: Commit** with the message "v1: places — first visit, tabs and the + tab".

### Task 5: Items: add, list, inspect, edit and delete

**Files:**
- Create: `app/inventory/ItemList.tsx`, `app/inventory/InspectPanel.tsx`, `app/inventory/ItemForm.tsx`
- Modify: `app/inventory/actions.ts` (the item actions), `app/inventory/InventoryScreen.tsx`

**Interfaces:**
- Consumes: `Fail`, `SESSION_ENDED`, `SAVE_FAILED` and `failureMessage` (Task 3), and the URL selection (Task 4).
- Produces:
  - `type ItemInput = { placeId: number; name: string; kind: Kind; state: ItemState }`
  - `addItem(input: ItemInput): Promise<{ ok: true; item: Item } | Fail>`
  - `updateItem(id: number, input: ItemInput): Promise<{ ok: true; item: Item } | Fail>`
  - `deleteItem(id: number): Promise<{ ok: true } | Fail>`

- [ ] **Step 1: Write the three item actions.**
  - Each action checks `auth()` first, returning `SESSION_ENDED` when there's no user.
  - Each one validates the name with `checkItemName` and checks `isKind`, `isItemState` and `Number.isInteger(placeId)`.
  - Writes go through `createServerSupabase()`, with no `user_id` filter. Errors become `failureMessage(error.code)`.
- [ ] **Step 2: Run the checks.** `npm test` and `npm run build` should pass.
- [ ] **Step 3: Write `ItemList`.**
  - One row per item in the selected place. Each row is a button with `data-item-id`, showing the `ItemIcon`, the name in Fredoka, `KIND_LABELS[kind]` in small muted caps, and a gold "NEW" badge when the item is `unused`.
  - Hover, focus and click all select the row, as in the proposal demo.
  - An empty place shows "Nothing here yet" and an "Add item" button. A non-empty place shows "Add item" above the rows.
- [ ] **Step 4: Write `ItemForm`.** It's used for both adding and editing:
  - a labelled "Name" field
  - "Type" as four `ItemIcon` toggle buttons in a `role="radiogroup"`
  - "State" as a select (Unused, In use, Used up), defaulting to Unused
  - for editing only, "Place" as a select of the person's places
  - Save and Cancel buttons. Save disables while pending, and errors use `role="alert"`.
  - Adding uses the selected tab as the place. After a save, the new item is selected.
- [ ] **Step 5: Write `InspectPanel`.**
  - A large `ItemIcon`, the name as a heading, then Type, Place and State rows.
  - For unused items, the NEW badge plus `waitingLabel(item.createdAt, new Date())`.
  - "Edit" opens `ItemForm` in place. Changing the place moves the item: it leaves this list, both tab counts update, and the selection moves to the next item.
  - "Delete" asks "Delete NAME?" in a small inline confirm (not `window.confirm`). On confirm, it deletes, and the selection moves to the next item.
  - With nothing selected, it shows "Pick an item to inspect it."
- [ ] **Step 6: Build and check it by hand.**
  - Add "Mnemosyne A5 Spiral" (Notebook, Unused) to Bookshelf. It shows NEW and "Waiting since today".
  - Add "LAMY Safari" (Pen, In use).
  - Edit the pen's place to My room. Both counts update.
  - Delete the pen.
  - Refreshing with `?item=` of the deleted pen falls back to the first item.
- [ ] **Step 7: Commit** with the message "v1: items — add, list, inspect, edit and delete".

### Task 6: Phone width, states and accessibility

**Files:**
- Modify: `app/inventory/*.tsx`, `app/globals.css`

- [ ] **Step 1: Phone width.**
  - Under 640 px, the list is full width.
  - Selecting an item shows `InspectPanel` below the list, scrolls it into view and moves focus to its heading.
  - The panel has a "Back to list" button that returns focus to the item's row.
  - At 640 px and up, list and inspect sit side by side, as in the proposal demo.
- [ ] **Step 2: States.**
  - `app/inventory/loading.tsx` shows a cream window saying "Opening your stash…".
  - An empty account shows the welcome panel, an empty place shows "Nothing here yet", and errors show as in Tasks 4 and 5.
  - The home page's Sign up and Sign in work by keyboard.
- [ ] **Step 3: Accessibility.**
  - Every control has a visible focus ring, and every field has a `<label>`.
  - The tablist has `aria-label="Places"`, and each tab has `aria-selected`.
  - A polite `aria-live` region announces "Added NAME to PLACE.", "Moved NAME to PLACE." and "Deleted NAME.".
- [ ] **Step 4: Check it in the browser at 375 × 812 and at desktop width.** Do the whole core task by keyboard only.
  - Use a 40-character place name and an 80-character item name with no spaces. Expected: they wrap, and `document.documentElement.scrollWidth <= innerWidth`.
  - Turn on reduced motion. Expected: the NEW badge doesn't bob.
- [ ] **Step 5: Commit** with the message "v1: phone width, states and accessibility".

### Task 7: Before you ship

Needs `E2E_USER_A_EMAIL` and `E2E_USER_B_EMAIL` in `.env.local`, as Clerk test users of the new app.

**Files:**
- Create: `playwright.config.ts`, `e2e/global.setup.ts` (copy from A4), `e2e/privacy.spec.ts`, `README.md`

- [ ] **Step 1: Write `playwright.config.ts`.**
  - Base it on A4's, without the fake museum.
  - The web server command is `npm run build && npx next start -p 3100 -H 127.0.0.1`, because `next dev` fails here.
  - `baseURL` is `http://127.0.0.1:3100`, with a 180-second timeout.
- [ ] **Step 2: Write `e2e/privacy.spec.ts`.** Sign-in works as in A4's `signedInPage`, then go to `/inventory`. Use unique names per run, like `Shelf ${Date.now()}`. Tests:
  - **"two people can't see each other's places or items":**
    - A adds a place and an item, and records their `data-place-id` and `data-item-id`.
    - B adds a place.
    - B's page has 0 elements with A's IDs and no text with A's names.
    - B opening `/inventory?place=<A's place>&item=<A's item>` still shows 0 of A's IDs.
  - **"a signed-out visitor is sent to sign-in":** `/inventory` ends on a URL whose path isn't `/inventory`, and there are no `[data-item-id]` elements.
  - **"double-clicking Add item saves one item":** in A's place, the row count rises by exactly 1 after a double-click on Save.
- [ ] **Step 3: Run the tests.** `npm run e2e` should show 3 passed.
- [ ] **Step 4: Scan the repo for keys.** `git grep -n -E 'sk_(test|live)_|service_role|eyJhbGci' -- . ':!package-lock.json'` should print nothing, and `git ls-files | grep -c '^\.env'` should print `0`.
- [ ] **Step 5: Run `/security-review`.** Fix anything it confirms, and note the rest in the README.
- [ ] **Step 6: Do an agent walkthrough as a new person.** On the live site, at phone width and at desktop width, sign up with a new email, set up places, log 3 items and browse. Write down every place I got stuck, and fix those.
- [ ] **Step 7: Nikita checks free tiers.** Supabase, Clerk and Vercel each stay on the free plan, with usage alerts or spend caps on wherever offered.
- [ ] **Step 8: Write `README.md`.** Cover what it is, the live link, the core task, the data model and privacy, how to run it, and links to the spec, this plan and `docs/v2-plan.md`.
- [ ] **Step 9: Commit** with the message "v1: privacy test, security review and README". Push when Nikita says so.

### Task 8: The v2 plan, after Isha's test

**Files:**
- Create: `docs/v2-plan.md`
- Modify: `README.md` (link to it)

- [ ] **Step 1: Write down Isha's test.** Nikita writes down what Isha did and said, in Isha's words, while doing the core task unaided.
- [ ] **Step 2: Draft the v2 plan with Nikita, from Isha's notes.**
  - What to fix first.
  - What to add: full stationery details per type, "Do I already have this?" with count and places, "Move to…" with its animation, feel ratings, illustrated places, and the bag-opening animation.
  - What waits.
  - Start from what Isha hit. Never invent quotes.
- [ ] **Step 3: Commit** with the message "v1: v2 plan from Isha's test". Push when Nikita says so.
- [ ] **Step 4: Nikita submits.** In Google Classroom, submit the live URL `https://final-project-51238-basunikita.vercel.app`, the GitHub URL and the v2 plan.
