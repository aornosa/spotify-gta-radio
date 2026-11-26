"use client";

import { useRef } from "react";
import { PowerOff } from "lucide-react";
import type { Station } from "@/data/stations";

/** Slot 0 is always "Radio Off"; slots 1..n are stations, laid out clockwise from the top. */
export type WheelSlot = Station | null;

interface Props {
  slots: WheelSlot[];
  highlight: number;
  currentId: string | null;
  /** Song on the station you're tuned to, shown in the middle like the in-car display. */
  nowLine: { name: string; artists: string } | null;
  onHover: (index: number) => void;
  onPick: (index: number) => void;
  onDismiss: () => void;
}

/** Ring radius, as a fraction of the wheel's size. */
const RING = 0.4;

export function RadioWheel({ slots, highlight, currentId, nowLine, onHover, onPick, onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  /** Last real pointer position; Chrome fires "moves" when the layout changes under a still cursor. */
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const n = slots.length;
  const step = 360 / n;
  // Spread the badges evenly around the whole ring: size them from the gap between neighbours.
  const gap = (2 * Math.PI * RING) / n;
  const badge = Math.min(gap * 0.8, 0.15);

  const angleOf = (i: number) => i * step - 90; // degrees, 0 = top, clockwise
  const indexFromPointer = (clientX: number, clientY: number): number | null => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return null;
    const dx = clientX - (box.left + box.width / 2);
    const dy = clientY - (box.top + box.height / 2);
    if (Math.hypot(dx, dy) < box.width * 0.12) return null; // dead zone in the middle
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    return ((Math.round(deg / step) % n) + n) % n;
  };

  const focus = slots[highlight];
  const focusIsCurrent = focus ? focus.id === currentId : currentId === null;

  // Selection wedge behind the highlighted badge (SVG units: 0..100).
  const a0 = ((angleOf(highlight) - step / 2) * Math.PI) / 180;
  const a1 = ((angleOf(highlight) + step / 2) * Math.PI) / 180;
  const R = RING * 100;
  const w = badge * 100 * 1.25;
  const pt = (r: number, a: number) => `${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)}`;
  const wedge = `M ${pt(R - w / 2, a0)} L ${pt(R + w / 2, a0)} A ${R + w / 2} ${R + w / 2} 0 0 1 ${pt(R + w / 2, a1)} L ${pt(R - w / 2, a1)} A ${R - w / 2} ${R - w / 2} 0 0 0 ${pt(R - w / 2, a0)} Z`;
  const accent = focus?.color ?? "#9ca3af";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        ref={ref}
        role="listbox"
        aria-label="Radio stations"
        className="relative aspect-square w-[min(96vw,94dvh)] select-none touch-none"
        onPointerMove={(e) => {
          // Compare with the last position we acted on: synthetic events (same spot) are ignored,
          // while slow real movement still adds up past the threshold.
          const last = lastPointer.current;
          if (!last) {
            lastPointer.current = { x: e.clientX, y: e.clientY };
            return;
          }
          if (Math.hypot(e.clientX - last.x, e.clientY - last.y) < 3) return;
          lastPointer.current = { x: e.clientX, y: e.clientY };
          const i = indexFromPointer(e.clientX, e.clientY);
          if (i !== null) onHover(i);
        }}
      >
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <radialGradient id="wheel-fade">
              <stop offset="55%" stopColor="#000" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="50" fill="url(#wheel-fade)" />
          <circle cx="50" cy="50" r={R} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth={badge * 100 * 1.25} />
          <path d={wedge} fill={accent} fillOpacity="0.35" stroke={accent} strokeOpacity="0.9" strokeWidth="0.25" className="transition-[d] duration-75" />
        </svg>

        {slots.map((slot, i) => {
          const a = (angleOf(i) * Math.PI) / 180;
          const active = i === highlight;
          const playing = slot ? slot.id === currentId : currentId === null;
          return (
            <button
              key={slot?.id ?? "off"}
              role="option"
              aria-selected={active}
              aria-label={slot?.name ?? "Radio off"}
              onClick={() => onPick(i)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-[transform,opacity] duration-100 ${
                active ? "z-10 scale-[1.18] opacity-100" : "scale-100 opacity-75 hover:opacity-100"
              }`}
              style={{
                left: `${50 + RING * 100 * Math.cos(a)}%`,
                top: `${50 + RING * 100 * Math.sin(a)}%`,
                width: `${badge * 100}%`,
                aspectRatio: "1",
              }}
            >
              <span
                className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full font-display text-[clamp(0.55rem,1.8vmin,0.95rem)] leading-none text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
                style={{
                  outline: active ? "3px solid white" : `2px solid ${slot ? slot.color : "rgba(255,255,255,0.3)"}`,
                  outlineOffset: active ? 2 : 0,
                  background: slot
                    ? `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${slot.color} 70%, white), ${slot.color} 45%, color-mix(in srgb, ${slot.color} 55%, black))`
                    : "radial-gradient(circle at 35% 30%, #4b5563, #1f2937 60%, #111827)",
                }}
              >
                {slot ? slot.short : <PowerOff className="h-1/3 w-1/3" />}
                {slot?.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- Spotify CDN cover art
                  <img
                    src={slot.image}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </span>
              {playing && (
                <span className="absolute -bottom-[14%] left-1/2 h-[10%] w-[10%] min-h-1.5 min-w-1.5 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              )}
            </button>
          );
        })}

        {/* center display */}
        <div
          className="pointer-events-none absolute flex flex-col items-center justify-center px-2 text-center"
          style={{ inset: `${(0.5 - RING + badge * 0.9) * 100}%` }}
        >
          <div className="text-[clamp(0.6rem,1.6vmin,0.8rem)] font-semibold uppercase tracking-[0.25em] text-white/45">
            {focusIsCurrent && focus ? "Now playing" : focus ? focus.genre : " "}
          </div>
          <div
            className="mt-1 font-display text-[clamp(1.2rem,4.6vmin,2.6rem)] uppercase leading-[1.05] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.8)]"
          >
            {focus ? focus.name : "Radio Off"}
          </div>
          <div className="mt-2 h-[1px] w-1/3" style={{ background: accent, opacity: 0.8 }} />
          {focusIsCurrent && focus && nowLine ? (
            <div className="mt-2 max-w-full text-[clamp(0.7rem,2vmin,1rem)] leading-snug">
              <div className="truncate font-semibold text-white/90">{nowLine.name}</div>
              <div className="truncate text-white/55">{nowLine.artists}</div>
            </div>
          ) : (
            <div className="mt-2 text-[clamp(0.65rem,1.8vmin,0.9rem)] text-white/45">
              {focus ? (focus.custom ? "Custom station" : "Rockstar Games playlist") : "Silence"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
