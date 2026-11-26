"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Laptop,
  ListMusic,
  Loader2,
  Play,
  RefreshCw,
  Speaker,
  Square,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Station } from "@/data/stations";
import type { Device, NowPlaying, PlaybackMode } from "@/lib/radio/playback";

interface Props {
  station: Station | null;
  nowPlaying: NowPlaying | null;
  playing: boolean;
  tuning: boolean;
  onPlayToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  volume: number;
  onVolume: (v: number) => void;
  mode: PlaybackMode;
  onMode: (m: PlaybackMode) => void;
  devices: Device[];
  deviceId: string | null;
  onDevice: (id: string | null) => void;
  onRefreshDevices: () => void;
  onOpenStations: () => void;
}

export function ControlBar(p: Props) {
  const track = p.station && p.nowPlaying?.contextUri?.endsWith(p.station.playlistId) ? p.nowPlaying : null;

  return (
    <footer className="relative border-t border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <Progress track={track} playing={p.playing} color={p.station?.color} />

      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
        {/* now playing */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-800 shadow"
            style={{ boxShadow: p.station ? `0 0 0 2px ${p.station.color}` : undefined }}
          >
            {(track?.albumArt ?? p.station?.image) && (
              // eslint-disable-next-line @next/next/no-img-element -- Spotify CDN art
              <img src={track?.albumArt ?? p.station?.image} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {track?.name ?? (p.station ? (p.tuning ? "Tuning in…" : p.station.name) : "Radio off")}
            </div>
            <div className="truncate text-xs text-white/55">
              {track ? track.artists : p.station ? p.station.genre : "Pick a station to start"}
            </div>
          </div>
        </div>

        {/* transport */}
        <div className="flex items-center gap-2 justify-self-end sm:justify-self-center">
          <IconButton label="Previous station" onClick={p.onPrev}>
            <ChevronLeft className="h-5 w-5" />
          </IconButton>
          <button
            onClick={p.onPlayToggle}
            aria-label={p.playing ? "Turn radio off" : "Play"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 active:scale-95"
          >
            {p.tuning ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : p.playing ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            )}
          </button>
          <IconButton label="Next station" onClick={p.onNext}>
            <ChevronRight className="h-5 w-5" />
          </IconButton>
        </div>

        {/* volume, output, stations */}
        <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
          <VolumeControl volume={p.volume} onVolume={p.onVolume} />
          <div className="flex items-center gap-1">
            <OutputPicker {...p} />
            <IconButton label="Manage stations" onClick={p.onOpenStations}>
              <ListMusic className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </div>
    </footer>
  );
}

function IconButton({ label, onClick, children, active }: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white ${
        active ? "bg-white/10 text-white" : "text-white/70"
      }`}
    >
      {children}
    </button>
  );
}

/** Thin progress line along the top of the bar, extrapolated between player updates. */
function Progress({ track, playing, color }: { track: NowPlaying | null; playing: boolean; color?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [playing]);

  const pct = track && track.durationMs > 0
    ? Math.min(100, ((track.positionMs + (playing ? Math.max(0, now - track.at) : 0)) / track.durationMs) * 100)
    : 0;
  return (
    <div className="absolute inset-x-0 top-0 h-[2px] bg-white/5">
      <div
        className="h-full transition-[width] duration-500 ease-linear"
        style={{ width: `${pct}%`, background: color ?? "#fff" }}
      />
    </div>
  );
}

function VolumeControl({ volume, onVolume }: { volume: number; onVolume: (v: number) => void }) {
  const lastNonZero = useRef(volume || 0.8);
  useEffect(() => {
    if (volume > 0) lastNonZero.current = volume;
  }, [volume]);
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="group flex items-center gap-1">
      <IconButton label={volume === 0 ? "Unmute" : "Mute"} onClick={() => onVolume(volume === 0 ? lastNonZero.current : 0)}>
        <Icon className="h-5 w-5" />
      </IconButton>
      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={volume}
        aria-label="Volume"
        onChange={(e) => onVolume(Number(e.target.value))}
        className="volume-slider w-24 sm:w-28"
        style={{ "--fill": `${volume * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}

function OutputPicker(p: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const Icon = p.mode === "sdk" ? Laptop : Speaker;
  const choose = (m: PlaybackMode, device: string | null = null) => {
    p.onMode(m);
    if (m === "connect") p.onDevice(device);
    if (m === "sdk") setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <IconButton
        label="Audio output"
        active={open}
        onClick={() => {
          setOpen((o) => !o);
          p.onRefreshDevices();
        }}
      >
        <Icon className="h-5 w-5" />
      </IconButton>

      {open && (
        <div className="absolute bottom-12 right-0 z-50 w-72 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/95 p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="px-3 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-wider text-white/40">Play on</div>
          <OutputRow icon={<Laptop className="h-4 w-4" />} label="This browser" sub="Plays right here" selected={p.mode === "sdk"} onClick={() => choose("sdk")} />

          <div className="mt-1 flex items-center justify-between px-3 pb-1 pt-2">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-white/40">Spotify devices</span>
            <button onClick={p.onRefreshDevices} className="text-white/40 hover:text-white" aria-label="Refresh devices">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
          {p.devices.length === 0 ? (
            <p className="px-3 py-2 text-xs text-white/50">Open Spotify on your phone or computer, then refresh.</p>
          ) : (
            p.devices.map((d) => (
              <OutputRow
                key={d.id}
                icon={<Speaker className="h-4 w-4" />}
                label={d.name}
                sub={d.isActive ? `${d.type} · active` : d.type}
                selected={p.mode === "connect" && (p.deviceId ? p.deviceId === d.id : d.isActive)}
                onClick={() => choose("connect", d.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function OutputRow({ icon, label, sub, selected, onClick }: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/10 ${selected ? "text-emerald-300" : "text-white/85"}`}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{label}</span>
        <span className="block truncate text-xs capitalize text-white/45">{sub.toLowerCase()}</span>
      </span>
      {selected && <Check className="h-4 w-4 shrink-0" />}
    </button>
  );
}
