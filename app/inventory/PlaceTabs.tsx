"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { deletePlaceBlockedMessage, type Fail, type Place, SAVE_FAILED } from "@/lib/inventory";
import { PlaceNameForm } from "./PlaceNameForm";
import { Problem } from "./Problem";

export function tabId(placeId: number): string {
  return `place-tab-${placeId}`;
}

// The places as tabs, each with its item count, and a "+" tab at the end
// that names a new place.
export function PlaceTabs({
  places,
  counts,
  selectedId,
  onSelect,
  onAdd,
}: {
  places: Place[];
  counts: Map<number, number>;
  selectedId: number | null;
  onSelect: (placeId: number) => void;
  onAdd: (name: string) => Promise<{ ok: true } | Fail>;
}) {
  const [adding, setAdding] = useState(false);
  const tabs = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    if (selectedId !== null) {
      tabs.current.get(selectedId)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [selectedId]);

  function moveWithKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = places.length - 1;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % places.length
        : event.key === "ArrowLeft"
          ? (index - 1 + places.length) % places.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    onSelect(places[next].id);
    tabs.current.get(places[next].id)?.focus();
  }

  return (
    <div>
      <div className="tabbar">
        <div role="tablist" aria-label="Places" className="tabs">
          {places.map((place, index) => {
            const selected = place.id === selectedId;
            const count = counts.get(place.id) ?? 0;
            return (
              <button
                key={place.id}
                ref={(element) => {
                  if (element) tabs.current.set(place.id, element);
                  else tabs.current.delete(place.id);
                }}
                type="button"
                role="tab"
                id={tabId(place.id)}
                aria-selected={selected}
                aria-controls="place-panel"
                tabIndex={selected ? 0 : -1}
                data-place-id={place.id}
                className={`tab ${selected ? "tab-on" : ""}`}
                onClick={() => onSelect(place.id)}
                onKeyDown={(event) => moveWithKeys(event, index)}
              >
                {place.name}
                <span className="count">
                  <span className="sr-only">, </span>
                  {count}
                  <span className="sr-only">{count === 1 ? " item" : " items"}</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="tab tab-add"
          aria-label="Add a place"
          aria-expanded={adding}
          aria-controls={adding ? "new-place-form" : undefined}
          onClick={() => setAdding((open) => !open)}
        >
          +
        </button>
      </div>
      {adding && (
        <div id="new-place-form" className="panel mb-3">
          <PlaceNameForm
            label="Name the new place"
            submitLabel="Add place"
            placeholder="Small box"
            autoFocus
            onSubmit={async (name) => {
              const result = await onAdd(name);
              if (result.ok) setAdding(false);
              return result;
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
    </div>
  );
}

// The selected place's name, with its Rename and Delete options.
export function PlaceHeader({
  place,
  count,
  onRename,
  onDelete,
}: {
  place: Place;
  count: number;
  onRename: (name: string) => Promise<{ ok: true } | Fail>;
  onDelete: () => Promise<{ ok: true } | Fail>;
}) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  async function confirmDelete() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await onDelete();
      if (!result.ok) {
        setError(result.message);
        setConfirming(false);
      }
    } catch {
      setError(SAVE_FAILED);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 text-2xl wrap-anywhere">{place.name}</h2>
        <button
          type="button"
          className="btn btn-small"
          aria-label={`Options for ${place.name}`}
          aria-expanded={optionsOpen}
          aria-controls={optionsOpen ? "place-options" : undefined}
          onClick={() => setOptionsOpen((open) => !open)}
        >
          ⋯
        </button>
      </div>
      {optionsOpen && (
        <div id="place-options" className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              setOptionsOpen(false);
              setConfirming(false);
              setError("");
              setRenaming(true);
            }}
          >
            Rename
          </button>
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              setOptionsOpen(false);
              setRenaming(false);
              if (count > 0) {
                setError(deletePlaceBlockedMessage(place.name, count));
              } else {
                setError("");
                setConfirming(true);
              }
            }}
          >
            Delete place
          </button>
        </div>
      )}
      {renaming && (
        <PlaceNameForm
          label={`Rename ${place.name}`}
          submitLabel="Save"
          initial={place.name}
          autoFocus
          onSubmit={async (name) => {
            const result = await onRename(name);
            if (result.ok) setRenaming(false);
            return result;
          }}
          onCancel={() => setRenaming(false)}
        />
      )}
      {confirming && (
        <div className="panel mt-2 flex flex-wrap items-center gap-2">
          <p className="m-0 flex-1 basis-40 font-extrabold wrap-anywhere">Delete {place.name}?</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            autoFocus
            onClick={confirmDelete}
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
          <button type="button" className="btn" onClick={() => setConfirming(false)}>
            Keep it
          </button>
        </div>
      )}
      <Problem message={error} />
    </div>
  );
}
