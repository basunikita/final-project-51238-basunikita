"use client";

import { useEffect, useRef, useState } from "react";
import { type Fail, type Item, itemCounts, type Place } from "@/lib/inventory";
import {
  addItem,
  addPlace,
  deleteItem,
  deletePlace,
  type ItemInput,
  renamePlace,
  updateItem,
} from "./actions";
import { DETAIL_HEADING_ID, InspectPanel } from "./InspectPanel";
import { ItemForm } from "./ItemForm";
import { ADD_ITEM_BUTTON_ID, ItemList, type PickHow } from "./ItemList";
import { PlaceHeader, PlaceTabs, tabId } from "./PlaceTabs";
import { WelcomePanel } from "./WelcomePanel";

type Editor = null | { mode: "add" } | { mode: "edit"; itemId: number };
type FocusTarget = { to: "detail" } | { to: "row"; itemId: number } | { to: "tab"; placeId: number };

const PHONE_WIDTH = "(max-width: 639px)";

// After an item leaves a list, select the one that took its spot, or the
// one before it when it was last.
function neighbourOf(list: Item[], itemId: number): number | null {
  const index = list.findIndex((item) => item.id === itemId);
  const rest = list.filter((item) => item.id !== itemId);
  if (rest.length === 0) return null;
  return rest[Math.min(Math.max(index, 0), rest.length - 1)].id;
}

function firstItemIn(items: Item[], placeId: number): number | null {
  return items.find((item) => item.placeId === placeId)?.id ?? null;
}

export default function InventoryScreen({
  places: initialPlaces,
  items: initialItems,
  initialPlaceId,
  initialItemId,
  now,
}: {
  places: Place[];
  items: Item[];
  initialPlaceId: number | null;
  initialItemId: number | null;
  now: string;
}) {
  const [places, setPlaces] = useState(initialPlaces);
  const [items, setItems] = useState(initialItems);
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [itemId, setItemId] = useState(initialItemId);
  const [welcoming, setWelcoming] = useState(initialPlaces.length === 0);
  const [editor, setEditor] = useState<Editor>(null);
  const [announcement, setAnnouncement] = useState("");
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const pinnedByClick = useRef(false);

  const showWelcome = welcoming || places.length === 0;
  const place = places.find((candidate) => candidate.id === placeId) ?? null;
  const placeItems = place ? items.filter((item) => item.placeId === place.id) : [];
  const item = placeItems.find((candidate) => candidate.id === itemId) ?? null;
  const counts = itemCounts(items);

  // Keep the selection in the URL so a refresh or a shared link opens the
  // same tab and item. replaceState doesn't ask the server for a new page.
  useEffect(() => {
    const query =
      showWelcome || placeId === null
        ? ""
        : `?place=${placeId}${itemId === null ? "" : `&item=${itemId}`}`;
    if (window.location.search !== query) {
      window.history.replaceState(null, "", `/inventory${query}`);
    }
  }, [showWelcome, placeId, itemId]);

  // Focus moves only after React has drawn the element it moves to.
  useEffect(() => {
    if (!focusTarget) return;
    const element =
      focusTarget.to === "detail"
        ? document.getElementById(DETAIL_HEADING_ID)
        : focusTarget.to === "row"
          ? document.querySelector<HTMLElement>(`[data-item-id="${focusTarget.itemId}"]`)
          : document.getElementById(tabId(focusTarget.placeId));
    (element ?? document.getElementById(ADD_ITEM_BUTTON_ID))?.focus();
  }, [focusTarget]);

  function announce(message: string) {
    setAnnouncement(message);
  }

  function selectPlace(id: number) {
    setPlaceId(id);
    setItemId(firstItemIn(items, id));
    setEditor(null);
  }

  function pickItem(id: number, how: PickHow) {
    const chosen = how === "click" || how === "key";
    if (!chosen && editor !== null) return;
    // After a click, the pointer crosses other rows on its way to Edit or
    // Delete, so hovering selects again only once it has left the rows.
    if (how === "hover" && pinnedByClick.current) return;
    if (chosen) pinnedByClick.current = true;
    setEditor(null);
    setItemId(id);
    // Enter moves on to the item's details, so the next Tab reaches its Edit
    // button instead of selecting each row below it.
    if (how === "key" || (how === "click" && window.matchMedia(PHONE_WIDTH).matches)) {
      setFocusTarget({ to: "detail" });
    }
  }

  async function onAddPlace(name: string): Promise<{ ok: true } | Fail> {
    const result = await addPlace(name);
    if (!result.ok) return result;
    setPlaces((current) => [...current, result.place]);
    setPlaceId(result.place.id);
    setItemId(null);
    setEditor(null);
    announce(`Added ${result.place.name}.`);
    if (!showWelcome) setFocusTarget({ to: "tab", placeId: result.place.id });
    return { ok: true };
  }

  async function onRenamePlace(name: string): Promise<{ ok: true } | Fail> {
    if (!place) return { ok: true };
    const result = await renamePlace(place.id, name);
    if (!result.ok) return result;
    setPlaces((current) =>
      current.map((candidate) => (candidate.id === result.place.id ? result.place : candidate)),
    );
    announce(`Renamed ${place.name} to ${result.place.name}.`);
    return { ok: true };
  }

  async function onDeletePlace(): Promise<{ ok: true } | Fail> {
    if (!place) return { ok: true };
    const result = await deletePlace(place.id);
    if (!result.ok) return result;
    const index = places.findIndex((candidate) => candidate.id === place.id);
    const rest = places.filter((candidate) => candidate.id !== place.id);
    const next = rest[Math.min(index, rest.length - 1)] ?? null;
    setPlaces(rest);
    setPlaceId(next?.id ?? null);
    setItemId(next ? firstItemIn(items, next.id) : null);
    announce(`Deleted ${place.name}.`);
    if (next) setFocusTarget({ to: "tab", placeId: next.id });
    // With no places left, setting up starts over, and the welcome panel
    // stays until "Start logging" again.
    else setWelcoming(true);
    return { ok: true };
  }

  async function onSaveItem(input: ItemInput): Promise<{ ok: true } | Fail> {
    if (!place || !editor) return { ok: true };
    if (editor.mode === "add") {
      const result = await addItem(input);
      if (!result.ok) return result;
      setItems((current) => [...current, result.item]);
      setItemId(result.item.id);
      announce(`Added ${result.item.name} to ${place.name}.`);
    } else {
      const result = await updateItem(editor.itemId, input);
      if (!result.ok) return result;
      setItems((current) =>
        current.map((candidate) => (candidate.id === result.item.id ? result.item : candidate)),
      );
      if (result.item.placeId !== place.id) {
        const destination = places.find((candidate) => candidate.id === result.item.placeId);
        setItemId(neighbourOf(placeItems, result.item.id));
        announce(`Moved ${result.item.name} to ${destination?.name ?? "another place"}.`);
      } else {
        announce(`Saved ${result.item.name}.`);
      }
    }
    setEditor(null);
    setFocusTarget({ to: "detail" });
    return { ok: true };
  }

  async function onDeleteItem(): Promise<{ ok: true } | Fail> {
    if (!item) return { ok: true };
    const result = await deleteItem(item.id);
    if (!result.ok) return result;
    setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    setItemId(neighbourOf(placeItems, item.id));
    announce(`Deleted ${item.name}.`);
    setFocusTarget({ to: "detail" });
    return { ok: true };
  }

  const liveRegion = (
    <p className="sr-only" aria-live="polite">
      {announcement}
    </p>
  );

  if (showWelcome) {
    return (
      <>
        <WelcomePanel
          places={places}
          onAdd={onAddPlace}
          onStart={() => {
            const first = places[0];
            setWelcoming(false);
            setPlaceId(first.id);
            setItemId(firstItemIn(items, first.id));
            setFocusTarget({ to: "tab", placeId: first.id });
          }}
        />
        {liveRegion}
      </>
    );
  }

  const editing = editor?.mode === "edit" ? items.find((c) => c.id === editor.itemId) ?? null : null;

  return (
    <>
      <section className="window" aria-label="Your stash">
        <h1 className="sr-only">Your stash</h1>
        <PlaceTabs
          places={places}
          counts={counts}
          selectedId={placeId}
          onSelect={selectPlace}
          onAdd={onAddPlace}
        />
        {place && (
          <div role="tabpanel" id="place-panel" aria-labelledby={tabId(place.id)}>
            <PlaceHeader
              key={place.id}
              place={place}
              count={placeItems.length}
              onRename={onRenamePlace}
              onDelete={onDeletePlace}
            />
            <div className="split">
              <ItemList
                placeName={place.name}
                items={placeItems}
                selectedId={item?.id ?? null}
                onPick={pickItem}
                onLeaveRows={() => {
                  pinnedByClick.current = false;
                }}
                onAdd={() => {
                  setEditor({ mode: "add" });
                }}
              />
              {editor ? (
                <ItemForm
                  key={editor.mode === "edit" ? `edit-${editor.itemId}` : `add-${place.id}`}
                  item={editing}
                  placeId={place.id}
                  placeName={place.name}
                  places={places}
                  onSave={onSaveItem}
                  onCancel={() => {
                    setEditor(null);
                    setFocusTarget(
                      editing ? { to: "row", itemId: editing.id } : { to: "detail" },
                    );
                  }}
                />
              ) : (
                <InspectPanel
                  key={item?.id ?? "none"}
                  item={item}
                  placeName={place.name}
                  now={new Date(now)}
                  emptyPlace={placeItems.length === 0}
                  onEdit={() => item && setEditor({ mode: "edit", itemId: item.id })}
                  onDelete={onDeleteItem}
                  onBack={() => item && setFocusTarget({ to: "row", itemId: item.id })}
                />
              )}
            </div>
          </div>
        )}
      </section>
      {liveRegion}
    </>
  );
}
