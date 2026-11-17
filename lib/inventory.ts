export const KINDS = ["notebook", "pen", "pencil", "highlighter"] as const;
export type Kind = (typeof KINDS)[number];

export const STATES = ["unused", "in_use", "used_up"] as const;
export type ItemState = (typeof STATES)[number];

export const KIND_LABELS: Record<Kind, string> = {
  notebook: "Notebook",
  pen: "Pen",
  pencil: "Pencil",
  highlighter: "Highlighter",
};

export const STATE_LABELS: Record<ItemState, string> = {
  unused: "Unused",
  in_use: "In use",
  used_up: "Used up",
};

export const SUGGESTED_PLACES = ["Work backpack", "Home desk", "Bookshelf"];

export const PLACE_NAME_MAX = 40;
export const ITEM_NAME_MAX = 80;

export type Place = { id: number; name: string; createdAt: string };
export type Item = {
  id: number;
  placeId: number;
  name: string;
  kind: Kind;
  state: ItemState;
  createdAt: string;
};

export type Checked = { ok: true; value: string } | { ok: false; message: string };
export type Fail = { ok: false; message: string };

export const SESSION_ENDED = "Your session ended. Sign in again.";
export const SAVE_FAILED = "Couldn't save. Try again.";

export function duplicatePlaceMessage(name: string): string {
  return `You already have a place called ${name}.`;
}

export function checkPlaceName(raw: string, existing: Place[], exceptId?: number): Checked {
  const value = raw.trim();
  if (value === "") return { ok: false, message: "Give the place a name." };
  if (value.length > PLACE_NAME_MAX) {
    return { ok: false, message: `Keep place names to ${PLACE_NAME_MAX} characters.` };
  }
  const clash = existing.find(
    (place) => place.id !== exceptId && place.name.toLowerCase() === value.toLowerCase(),
  );
  if (clash) return { ok: false, message: duplicatePlaceMessage(clash.name) };
  return { ok: true, value };
}

export function checkItemName(raw: string): Checked {
  const value = raw.trim();
  if (value === "") return { ok: false, message: "Give the item a name." };
  if (value.length > ITEM_NAME_MAX) {
    return { ok: false, message: `Keep item names to ${ITEM_NAME_MAX} characters.` };
  }
  return { ok: true, value };
}

export function isKind(v: unknown): v is Kind {
  return typeof v === "string" && (KINDS as readonly string[]).includes(v);
}

export function isItemState(v: unknown): v is ItemState {
  return typeof v === "string" && (STATES as readonly string[]).includes(v);
}

const DAY_MS = 86_400_000;

export function waitingLabel(createdAt: string, now: Date): string {
  const days = Math.floor((now.getTime() - Date.parse(createdAt)) / DAY_MS);
  if (days < 1) return "Waiting since today";
  return days === 1 ? "Waiting 1 day" : `Waiting ${days} days`;
}

export function itemCounts(items: Item[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const item of items) counts.set(item.placeId, (counts.get(item.placeId) ?? 0) + 1);
  return counts;
}

export function resolveSelection(
  places: Place[],
  items: Item[],
  params: { place?: string; item?: string },
): { placeId: number | null; itemId: number | null } {
  if (places.length === 0) return { placeId: null, itemId: null };
  const askedPlace = Number(params.place);
  const placeId = places.some((place) => place.id === askedPlace) ? askedPlace : places[0].id;
  const inPlace = items.filter((item) => item.placeId === placeId);
  const askedItem = Number(params.item);
  const itemId = inPlace.some((item) => item.id === askedItem)
    ? askedItem
    : (inPlace[0]?.id ?? null);
  return { placeId, itemId };
}

export function deletePlaceBlockedMessage(placeName: string, count: number): string {
  const things = count === 1 ? "1 item" : `${count} items`;
  return `Move or delete the ${things} in ${placeName} first.`;
}

// PostgREST answers an invalid session token with PGRST301 and, from
// version 12, an expired one with PGRST303.
const SESSION_ERROR_CODES = ["PGRST301", "PGRST303"];

export function failureMessage(code: string | undefined): string {
  return code !== undefined && SESSION_ERROR_CODES.includes(code) ? SESSION_ENDED : SAVE_FAILED;
}

export const PLACE_COLUMNS = "id,name,created_at";
export const ITEM_COLUMNS = "id,place_id,name,kind,state,created_at";

type PlaceRow = { id: number; name: string; created_at: string };
type ItemRow = {
  id: number;
  place_id: number;
  name: string;
  kind: Kind;
  state: ItemState;
  created_at: string;
};

export function placeFromRow(row: PlaceRow): Place {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

export function itemFromRow(row: ItemRow): Item {
  return {
    id: row.id,
    placeId: row.place_id,
    name: row.name,
    kind: row.kind,
    state: row.state,
    createdAt: row.created_at,
  };
}
