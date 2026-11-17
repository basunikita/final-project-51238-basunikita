"use client";

import { type FormEvent, useId, useRef, useState } from "react";
import {
  checkItemName,
  type Fail,
  type Item,
  type ItemState,
  KIND_LABELS,
  KINDS,
  type Kind,
  type Place,
  SAVE_FAILED,
  STATE_LABELS,
  STATES,
} from "@/lib/inventory";
import { ItemIcon } from "../ui/ItemIcon";
import type { ItemInput } from "./actions";
import { DETAIL_HEADING_ID } from "./InspectPanel";
import { Problem } from "./Problem";

// Adding and editing share one form. Adding files the item into the selected
// tab's place; editing can also move it to another place.
export function ItemForm({
  item,
  placeId,
  placeName,
  places,
  onSave,
  onCancel,
}: {
  item: Item | null;
  placeId: number;
  placeName: string;
  places: Place[];
  onSave: (input: ItemInput) => Promise<{ ok: true } | Fail>;
  onCancel: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(item?.name ?? "");
  const [kind, setKind] = useState<Kind>(item?.kind ?? "notebook");
  const [state, setState] = useState<ItemState>(item?.state ?? "unused");
  const [place, setPlace] = useState(item?.placeId ?? placeId);
  const [nameError, setNameError] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setError("");
    const checked = checkItemName(name);
    if (!checked.ok) {
      setNameError(checked.message);
      return;
    }
    setNameError("");
    busy.current = true;
    setPending(true);
    try {
      const result = await onSave({ placeId: place, name: checked.value, kind, state });
      if (!result.ok) setError(result.message);
    } catch {
      setError(SAVE_FAILED);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <section className="detail" aria-labelledby={DETAIL_HEADING_ID}>
      <h2 id={DETAIL_HEADING_ID} tabIndex={-1} className="mt-0 mb-3 text-xl wrap-anywhere">
        {item ? `Edit ${item.name}` : `New item in ${placeName}`}
      </h2>
      <form onSubmit={submit} noValidate className="grid gap-3.5">
        <div>
          <label htmlFor={`${id}-name`} className="field-label">
            Name
          </label>
          <input
            id={`${id}-name`}
            className="field"
            value={name}
            placeholder="Mnemosyne A5 Spiral"
            autoComplete="off"
            autoFocus
            aria-invalid={nameError ? true : undefined}
            aria-describedby={`${id}-name-problem`}
            onChange={(event) => setName(event.target.value)}
          />
          <Problem id={`${id}-name-problem`} message={nameError} />
        </div>

        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="field-label">Type</legend>
          <div className="kind-picker">
            {KINDS.map((option) => (
              <label key={option} className="kind-option">
                <input
                  type="radio"
                  name={`${id}-kind`}
                  value={option}
                  checked={kind === option}
                  onChange={() => setKind(option)}
                  className="sr-only"
                />
                <ItemIcon kind={option} className="size-9" decorative />
                {KIND_LABELS[option]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${id}-state`} className="field-label">
            State
          </label>
          <select
            id={`${id}-state`}
            className="field"
            value={state}
            onChange={(event) => setState(event.target.value as ItemState)}
          >
            {STATES.map((option) => (
              <option key={option} value={option}>
                {STATE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {item && (
          <div>
            <label htmlFor={`${id}-place`} className="field-label">
              Place
            </label>
            <select
              id={`${id}-place`}
              className="field"
              value={place}
              onChange={(event) => setPlace(Number(event.target.value))}
            >
              {places.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <Problem message={error} />
      </form>
    </section>
  );
}
