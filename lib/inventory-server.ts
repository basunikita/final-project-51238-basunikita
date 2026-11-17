import { auth } from "@clerk/nextjs/server";
import {
  type Fail,
  type Item,
  ITEM_COLUMNS,
  itemFromRow,
  type Place,
  PLACE_COLUMNS,
  placeFromRow,
  SESSION_ENDED,
} from "@/lib/inventory";
import { createServerSupabase } from "@/lib/supabase-server";

export const LOAD_FAILED = "Your stash couldn't be opened. Try again.";

// No user_id filter on purpose: row-level security returns only this
// person's rows, and the Playwright privacy test depends on that.
export async function loadInventory(): Promise<{ ok: true; places: Place[]; items: Item[] } | Fail> {
  const { userId } = await auth();
  if (!userId) return { ok: false, message: SESSION_ENDED };

  const supabase = await createServerSupabase();
  const [places, items] = await Promise.all([
    supabase.from("places").select(PLACE_COLUMNS).order("created_at").order("id"),
    supabase.from("items").select(ITEM_COLUMNS).order("created_at").order("id"),
  ]);
  if (places.error || items.error || !places.data || !items.data) {
    const error = places.error ?? items.error;
    console.error("loadInventory: select failed:", error?.code, error?.message);
    return { ok: false, message: LOAD_FAILED };
  }
  return { ok: true, places: places.data.map(placeFromRow), items: items.data.map(itemFromRow) };
}
