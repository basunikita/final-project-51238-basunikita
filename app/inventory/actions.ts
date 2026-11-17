"use server";

import { auth } from "@clerk/nextjs/server";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  checkItemName,
  checkPlaceName,
  deletePlaceBlockedMessage,
  duplicatePlaceMessage,
  type Fail,
  failureMessage,
  isItemState,
  isKind,
  type Item,
  ITEM_COLUMNS,
  itemFromRow,
  type ItemState,
  type Kind,
  type Place,
  PLACE_COLUMNS,
  placeFromRow,
  SAVE_FAILED,
  SESSION_ENDED,
} from "@/lib/inventory";
import { createServerSupabase } from "@/lib/supabase-server";

// Every action checks the session itself: the proxy deliberately lets
// server actions through so they can answer "Your session ended" here.
// No query filters by user_id; row-level security does that.

export type ItemInput = { placeId: number; name: string; kind: Kind; state: ItemState };

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

async function signedIn(): Promise<boolean> {
  const { userId } = await auth();
  return Boolean(userId);
}

function fail(where: string, error: PostgrestError | null): Fail {
  console.error(`${where} failed:`, error?.code, error?.message);
  return { ok: false, message: failureMessage(error?.code) };
}

function isId(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) > 0;
}

async function currentPlaces(supabase: SupabaseClient): Promise<Place[] | Fail> {
  const { data, error } = await supabase.from("places").select(PLACE_COLUMNS);
  if (error || !data) return fail("currentPlaces", error);
  return data.map(placeFromRow);
}

export async function addPlace(name: string): Promise<{ ok: true; place: Place } | Fail> {
  if (!(await signedIn())) return { ok: false, message: SESSION_ENDED };
  if (typeof name !== "string") return { ok: false, message: SAVE_FAILED };

  const supabase = await createServerSupabase();
  const places = await currentPlaces(supabase);
  if (!Array.isArray(places)) return places;
  const checked = checkPlaceName(name, places);
  if (!checked.ok) return checked;

  const { data, error } = await supabase
    .from("places")
    .insert({ name: checked.value })
    .select(PLACE_COLUMNS)
    .single();
  if (error?.code === UNIQUE_VIOLATION) {
    return { ok: false, message: duplicatePlaceMessage(checked.value) };
  }
  if (error || !data) return fail("addPlace", error);
  return { ok: true, place: placeFromRow(data) };
}

export async function renamePlace(
  id: number,
  name: string,
): Promise<{ ok: true; place: Place } | Fail> {
  if (!(await signedIn())) return { ok: false, message: SESSION_ENDED };
  if (!isId(id) || typeof name !== "string") return { ok: false, message: SAVE_FAILED };

  const supabase = await createServerSupabase();
  const places = await currentPlaces(supabase);
  if (!Array.isArray(places)) return places;
  const checked = checkPlaceName(name, places, id);
  if (!checked.ok) return checked;

  const { data, error } = await supabase
    .from("places")
    .update({ name: checked.value })
    .eq("id", id)
    .select(PLACE_COLUMNS)
    .single();
  if (error?.code === UNIQUE_VIOLATION) {
    return { ok: false, message: duplicatePlaceMessage(checked.value) };
  }
  if (error || !data) return fail("renamePlace", error);
  return { ok: true, place: placeFromRow(data) };
}

export async function deletePlace(id: number): Promise<{ ok: true } | Fail> {
  if (!(await signedIn())) return { ok: false, message: SESSION_ENDED };
  if (!isId(id)) return { ok: false, message: SAVE_FAILED };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    // The place still has items in it (on delete restrict).
    const [place, items] = await Promise.all([
      supabase.from("places").select("name").eq("id", id).single(),
      supabase.from("items").select("id", { count: "exact", head: true }).eq("place_id", id),
    ]);
    const placeName = place.data?.name ?? "this place";
    return { ok: false, message: deletePlaceBlockedMessage(placeName, items.count ?? 1) };
  }
  if (error) return fail("deletePlace", error);
  return { ok: true };
}

function checkItemInput(input: ItemInput): { ok: true; value: ItemInput } | Fail {
  if (typeof input !== "object" || input === null || typeof input.name !== "string") {
    return { ok: false, message: SAVE_FAILED };
  }
  const name = checkItemName(input.name);
  if (!name.ok) return name;
  if (!isKind(input.kind) || !isItemState(input.state) || !isId(input.placeId)) {
    return { ok: false, message: SAVE_FAILED };
  }
  return {
    ok: true,
    value: { placeId: input.placeId, name: name.value, kind: input.kind, state: input.state },
  };
}

function toRow(input: ItemInput) {
  return { place_id: input.placeId, name: input.name, kind: input.kind, state: input.state };
}

export async function addItem(input: ItemInput): Promise<{ ok: true; item: Item } | Fail> {
  if (!(await signedIn())) return { ok: false, message: SESSION_ENDED };
  const checked = checkItemInput(input);
  if (!checked.ok) return checked;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("items")
    .insert(toRow(checked.value))
    .select(ITEM_COLUMNS)
    .single();
  if (error || !data) return fail("addItem", error);
  return { ok: true, item: itemFromRow(data) };
}

export async function updateItem(
  id: number,
  input: ItemInput,
): Promise<{ ok: true; item: Item } | Fail> {
  if (!(await signedIn())) return { ok: false, message: SESSION_ENDED };
  if (!isId(id)) return { ok: false, message: SAVE_FAILED };
  const checked = checkItemInput(input);
  if (!checked.ok) return checked;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("items")
    .update(toRow(checked.value))
    .eq("id", id)
    .select(ITEM_COLUMNS)
    .single();
  if (error || !data) return fail("updateItem", error);
  return { ok: true, item: itemFromRow(data) };
}

export async function deleteItem(id: number): Promise<{ ok: true } | Fail> {
  if (!(await signedIn())) return { ok: false, message: SESSION_ENDED };
  if (!isId(id)) return { ok: false, message: SAVE_FAILED };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return fail("deleteItem", error);
  return { ok: true };
}
