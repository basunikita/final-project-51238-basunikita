"use client";

import { useRef, useState } from "react";
import { type Fail, type Place, SAVE_FAILED, SUGGESTED_PLACES } from "@/lib/inventory";
import { PlaceNameForm } from "./PlaceNameForm";
import { Problem } from "./Problem";

// First visit: name the places your stash lives in before logging anything.
export function WelcomePanel({
  places,
  onAdd,
  onStart,
}: {
  places: Place[];
  onAdd: (name: string) => Promise<{ ok: true } | Fail>;
  onStart: () => void;
}) {
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const taken = new Set(places.map((place) => place.name.toLowerCase()));
  const suggestions = SUGGESTED_PLACES.filter((name) => !taken.has(name.toLowerCase()));

  async function addSuggestion(name: string) {
    if (busy.current) return;
    busy.current = true;
    setPendingName(name);
    setError("");
    try {
      const result = await onAdd(name);
      if (!result.ok) setError(result.message);
    } catch {
      setError(SAVE_FAILED);
    } finally {
      busy.current = false;
      setPendingName(null);
    }
  }

  return (
    <section className="window grid gap-5" aria-labelledby="welcome-heading">
      <div>
        <p className="eyebrow">Welcome to your Stationery Inventory</p>
        <h1 id="welcome-heading" className="mt-1.5 mb-2 text-[clamp(1.8rem,6vw,2.6rem)]">
          Where does your stash live?
        </h1>
        <p className="max-w-[48ch]">
          Add the places you keep stationery. Each one becomes a tab you can fill with notebooks,
          pens, pencils and highlighters. You can add more places later.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div>
          <p className="field-label">Tap to add</p>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  className="chip"
                  aria-label={`Add ${name}`}
                  disabled={pendingName !== null}
                  onClick={() => addSuggestion(name)}
                >
                  <span aria-hidden="true">+ </span>
                  {pendingName === name ? "Adding…" : name}
                </button>
              </li>
            ))}
          </ul>
          <Problem message={error} />
        </div>
      )}

      <PlaceNameForm
        label="Add your own"
        submitLabel="Add"
        placeholder="My room"
        clearOnSuccess
        onSubmit={onAdd}
      />

      <div>
        <p className="field-label">Your places</p>
        {places.length === 0 ? (
          <p className="text-muted italic">None yet. Add at least one to start.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5" aria-label="Your places">
            {places.map((place) => (
              <li key={place.id} className="tab tab-on cursor-default">
                {place.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <button
          type="button"
          className="btn btn-gold text-lg"
          disabled={places.length === 0}
          onClick={onStart}
        >
          Start logging
        </button>
      </div>
    </section>
  );
}
