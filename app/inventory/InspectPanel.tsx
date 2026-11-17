"use client";

import { useRef, useState } from "react";
import {
  type Fail,
  type Item,
  KIND_LABELS,
  SAVE_FAILED,
  STATE_LABELS,
  waitingLabel,
} from "@/lib/inventory";
import { ItemIcon } from "../ui/ItemIcon";
import { Problem } from "./Problem";

export const DETAIL_HEADING_ID = "detail-heading";

// The selected item, large, with what it is, where it lives and its state.
export function InspectPanel({
  item,
  placeName,
  now,
  emptyPlace,
  onEdit,
  onDelete,
  onBack,
}: {
  item: Item | null;
  placeName: string;
  now: Date;
  emptyPlace: boolean;
  onEdit: () => void;
  onDelete: () => Promise<{ ok: true } | Fail>;
  onBack: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  if (!item) {
    return (
      <section className="detail" aria-label="Inspect">
        <div className="pedestal" aria-hidden="true" />
        <p className="empty">
          {emptyPlace ? `Items you add to ${placeName} show up here.` : "Pick an item to inspect it."}
        </p>
      </section>
    );
  }

  async function confirmDelete() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await onDelete();
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
      <button type="button" className="link-btn phone-only mb-1" onClick={onBack}>
        ← Back to list
      </button>
      <div className="pedestal">
        <ItemIcon kind={item.kind} className="float size-26" />
      </div>
      <p className="card-kind m-0">{KIND_LABELS[item.kind]}</p>
      <h2 id={DETAIL_HEADING_ID} tabIndex={-1} className="mt-0.5 mb-2 text-xl wrap-anywhere">
        {item.name}
      </h2>
      <p className="mb-2 flex flex-wrap items-center gap-2">
        {item.state === "unused" ? (
          <>
            <span className="badge-new">NEW</span>
            <span className="status bg-butter">{waitingLabel(item.createdAt, now)}</span>
          </>
        ) : (
          <span className="status">{STATE_LABELS[item.state]}</span>
        )}
      </p>
      <dl className="rows">
        <div className="row">
          <dt>Type</dt>
          <dd>{KIND_LABELS[item.kind]}</dd>
        </div>
        <div className="row">
          <dt>Place</dt>
          <dd>{placeName}</dd>
        </div>
        <div className="row">
          <dt>State</dt>
          <dd>{STATE_LABELS[item.state]}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className="btn"
          aria-expanded={confirming}
          onClick={() => setConfirming(true)}
        >
          Delete
        </button>
      </div>
      {confirming && (
        <div className="panel mt-3 grid gap-2">
          <p className="m-0 font-extrabold wrap-anywhere">
            Delete {item.name}? This can&apos;t be undone.
          </p>
          <div className="flex flex-wrap gap-2">
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
        </div>
      )}
      <Problem message={error} />
    </section>
  );
}
