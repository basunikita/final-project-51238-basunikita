-- Places hold a person's stationery, and each item lives in one place.
-- user_id always comes from the Clerk session token's "sub" claim, never
-- from the app, and row-level security keys on it.
create table public.places (
  id bigint generated always as identity primary key,
  user_id text not null default (auth.jwt() ->> 'sub'),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);

-- One place per name per person, ignoring case.
create unique index places_user_name_idx on public.places (user_id, lower(name));

create table public.items (
  id bigint generated always as identity primary key,
  user_id text not null default (auth.jwt() ->> 'sub'),
  place_id bigint not null references public.places (id) on delete restrict,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 80),
  kind text not null check (kind in ('notebook', 'pen', 'pencil', 'highlighter')),
  state text not null default 'unused' check (state in ('unused', 'in_use', 'used_up')),
  created_at timestamptz not null default now()
);

create index items_user_place_idx on public.items (user_id, place_id);
create index items_place_id_idx on public.items (place_id);

alter table public.places enable row level security;
alter table public.items enable row level security;

create policy "People can read their own places"
  on public.places for select
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "People can add their own places"
  on public.places for insert
  to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "People can rename their own places"
  on public.places for update
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "People can delete their own places"
  on public.places for delete
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "People can read their own items"
  on public.items for select
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

-- An item may only be filed into one of the person's own places, so a
-- guessed place ID belonging to someone else is refused.
create policy "People can add items to their own places"
  on public.items for insert
  to authenticated
  with check (
    (select auth.jwt() ->> 'sub') = user_id
    and exists (
      select 1 from public.places p
      where p.id = place_id and p.user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "People can change their own items within their own places"
  on public.items for update
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check (
    (select auth.jwt() ->> 'sub') = user_id
    and exists (
      select 1 from public.places p
      where p.id = place_id and p.user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "People can delete their own items"
  on public.items for delete
  to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

grant select, insert, update, delete on table public.places to authenticated;
grant select, insert, update, delete on table public.items to authenticated;
