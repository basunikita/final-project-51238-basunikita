"use client";

import { type Item, KIND_LABELS } from "@/lib/inventory";
import { ItemIcon } from "../ui/ItemIcon";

// "key" is a click made with Enter or Space.
export type PickHow = "hover" | "focus" | "click" | "key";

export const ADD_ITEM_BUTTON_ID = "add-item-button";

// The selected place's items. Hovering, focusing or clicking a row selects it.
export function ItemList({
  placeName,
  items,
  selectedId,
  onPick,
  onLeaveRows,
  onAdd,
}: {
  placeName: string;
  items: Item[];
  selectedId: number | null;
  onPick: (itemId: number, how: PickHow) => void;
  onLeaveRows: () => void;
  onAdd: () => void;
}) {
  const addButton = (
    <button
      id={ADD_ITEM_BUTTON_ID}
      type="button"
      className="btn btn-small btn-primary"
      onClick={onAdd}
    >
      Add item
    </button>
  );

  return (
    <section className="list" aria-label={`Items in ${placeName}`}>
      {items.length === 0 ? (
        <div className="grid justify-items-center gap-2 pb-4">
          <p className="empty">Nothing here yet</p>
          {addButton}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-2">
            <span className="text-sm font-extrabold text-muted">
              {items.length === 1 ? "1 item" : `${items.length} items`}
            </span>
            {addButton}
          </div>
          <ul onMouseLeave={onLeaveRows}>
            {items.map((item) => {
              const selected = item.id === selectedId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    data-item-id={item.id}
                    aria-current={selected ? "true" : undefined}
                    className={`li ${selected ? "li-on" : ""}`}
                    onMouseEnter={() => onPick(item.id, "hover")}
                    onFocus={() => onPick(item.id, "focus")}
                    onClick={(event) => onPick(item.id, event.detail === 0 ? "key" : "click")}
                  >
                    <ItemIcon kind={item.kind} className="size-8" decorative />
                    <span className="li-name">
                      {item.name}
                      <span className="li-kind">{KIND_LABELS[item.kind]}</span>
                    </span>
                    {item.state === "unused" && <span className="badge-new">NEW</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
