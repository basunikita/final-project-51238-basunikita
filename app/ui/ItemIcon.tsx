import type { ReactNode } from "react";
import { KIND_LABELS, type Kind } from "@/lib/inventory";

// The four item icons, drawn as in the project proposal's SVG symbols.
const INK = "#3b2f3a";
const PAPER = "#fffdf8";

const KIND_COLORS: Record<Kind, string> = {
  notebook: "#4b4f63",
  pen: "#f4a3bd",
  pencil: "#4f7fc4",
  highlighter: "#a8d5ee",
};

function Notebook({ color }: { color: string }) {
  return (
    <>
      <rect x="12" y="5" width="28" height="38" rx="3" fill={color} stroke={INK} strokeWidth="2" />
      <rect x="19" y="11" width="15" height="9" rx="1.5" fill={PAPER} stroke={INK} strokeWidth="1.2" />
      <path d="M22 14.5h9M22 17h6" stroke={INK} strokeWidth="1" strokeLinecap="round" />
      <g fill={PAPER} stroke={INK} strokeWidth="1.4">
        {[8, 14, 20, 26, 32, 38].map((y) => (
          <rect key={y} x="9" y={y} width="7" height="3" rx="1.5" />
        ))}
      </g>
    </>
  );
}

function Pen({ color }: { color: string }) {
  return (
    <g transform="rotate(40 24 24)">
      <rect x="20.5" y="3" width="7" height="31" rx="3.5" fill={color} stroke={INK} strokeWidth="2" />
      <rect x="26.5" y="4" width="2.5" height="14" rx="1.2" fill={color} stroke={INK} strokeWidth="1.2" />
      <path d="M21.5 34 L24 42 L26.5 34 Z" fill="#d7d9e0" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="24" cy="43.2" r="1.2" fill={INK} />
    </g>
  );
}

function Pencil({ color }: { color: string }) {
  return (
    <g transform="rotate(40 24 24)">
      <rect x="20" y="3" width="8" height="30" rx="1.5" fill={color} stroke={INK} strokeWidth="2" />
      <path d="M22.7 4v28M25.3 4v28" stroke={INK} strokeOpacity=".35" strokeWidth="1" />
      <path d="M20 33 L24 44 L28 33 Z" fill="#f3d2a2" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M22.5 40 L24 44 L25.5 40 Z" fill={INK} />
    </g>
  );
}

function Highlighter({ color }: { color: string }) {
  return (
    <g transform="rotate(40 24 24)">
      <rect x="18" y="4" width="12" height="25" rx="3.5" fill={color} stroke={INK} strokeWidth="2" />
      <rect x="21" y="9" width="6" height="12" rx="1.5" fill={PAPER} fillOpacity=".6" />
      <path d="M19 29h10l-1.5 6h-7z" fill={PAPER} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M21 35h6l-1 7h-4z" fill={color} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  );
}

const DRAWINGS: Record<Kind, (props: { color: string }) => ReactNode> = {
  notebook: Notebook,
  pen: Pen,
  pencil: Pencil,
  highlighter: Highlighter,
};

export function ItemIcon({
  kind,
  className = "size-12",
  title,
  decorative = false,
}: {
  kind: Kind;
  className?: string;
  title?: string;
  decorative?: boolean;
}) {
  const Drawing = DRAWINGS[kind];
  const label = title ?? KIND_LABELS[kind];
  return (
    <svg
      viewBox="0 0 48 48"
      className={`block shrink-0 ${className}`}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
    >
      <Drawing color={KIND_COLORS[kind]} />
    </svg>
  );
}
