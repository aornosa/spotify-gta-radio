"use client";

import { useState } from "react";
import { parsePlaylistId, type Station } from "@/data/stations";
import { describeError } from "@/lib/spotify/client";

interface Props {
  stations: Station[];
  hiddenCount: number;
  onAdd: (playlistId: string) => Promise<Station>;
  onRemove: (s: Station) => void;
  onReset: () => void;
  onClose: () => void;
}

export function StationManager({ stations, hiddenCount, onAdd, onRemove, onReset, onClose }: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = parsePlaylistId(input);
    if (!id) return setMessage("Paste a Spotify playlist link (open.spotify.com/playlist/…).");
    setBusy(true);
    setMessage(null);
    try {
      const s = await onAdd(id);
      setInput("");
      setMessage(`Added “${s.name}”.`);
    } catch (err) {
      setMessage(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-2xl uppercase tracking-wide">Stations</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="border-b border-white/10 px-5 py-4">
          <label className="mb-2 block text-sm text-white/70" htmlFor="playlist-url">
            Add your own station from any Spotify playlist
          </label>
          <div className="flex gap-2">
            <input
              id="playlist-url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://open.spotify.com/playlist/…"
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <button
              disabled={busy || !input.trim()}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
            >
              {busy ? "Adding…" : "Add"}
            </button>
          </div>
          {message && <p className="mt-2 text-sm text-white/70">{message}</p>}
        </form>

        <ul className="flex-1 overflow-y-auto px-2 py-2">
          {stations.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5">
              <span
                className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-[0.65rem] text-white"
                style={{ background: s.color }}
              >
                {s.short}
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- Spotify CDN cover art
                  <img
                    src={s.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{s.name}</span>
                <span className="block truncate text-xs text-white/50">
                  {s.custom ? s.genre : `${s.genre} · official Rockstar playlist`}
                </span>
              </span>
              <a
                href={`https://open.spotify.com/playlist/${s.playlistId}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-white/50 hover:text-white"
              >
                Open
              </a>
              <button onClick={() => onRemove(s)} className="text-xs text-red-300/80 hover:text-red-300">
                {s.custom ? "Delete" : "Hide"}
              </button>
            </li>
          ))}
        </ul>

        {hiddenCount > 0 && (
          <div className="border-t border-white/10 px-5 py-3 text-right">
            <button onClick={onReset} className="text-sm text-emerald-300 hover:text-emerald-200">
              Restore {hiddenCount} hidden default station{hiddenCount === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
