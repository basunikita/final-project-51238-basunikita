"use client";

import { type FormEvent, useId, useRef, useState } from "react";
import { type Fail, SAVE_FAILED } from "@/lib/inventory";
import { Problem } from "./Problem";

// One field for naming a place: used to add your own on the welcome panel,
// for the "+" tab, and for renaming. Typed text stays put when saving fails.
export function PlaceNameForm({
  label,
  submitLabel,
  initial = "",
  placeholder,
  clearOnSuccess = false,
  autoFocus = false,
  onSubmit,
  onCancel,
}: {
  label: string;
  submitLabel: string;
  initial?: string;
  placeholder?: string;
  clearOnSuccess?: boolean;
  autoFocus?: boolean;
  onSubmit: (name: string) => Promise<{ ok: true } | Fail>;
  onCancel?: () => void;
}) {
  const id = useId();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await onSubmit(value);
      if (!result.ok) setError(result.message);
      else if (clearOnSuccess) setValue("");
    } catch {
      setError(SAVE_FAILED);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-2">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          className="field flex-1 basis-48"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-problem`}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && onCancel) onCancel();
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      <Problem id={`${id}-problem`} message={error} />
    </form>
  );
}
