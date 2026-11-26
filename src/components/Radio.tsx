"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRadio } from "@/lib/radio/useRadio";
import { listDevices, type Device } from "@/lib/radio/playback";
import { ControlBar } from "./ControlBar";
import { RadioWheel, type WheelSlot } from "./RadioWheel";
import { StationManager } from "./StationManager";
import { StationTitle } from "./StationTitle";

type WheelMode = "closed" | "hold" | "sticky";

/** Holding Q/Tab longer than this opens the wheel; a shorter tap skips to the next station. */
const HOLD_MS = 220;
/** Rapid taps only tune once you stop on a station. */
const TAP_SETTLE_MS = 450;

export function Radio() {
  const radio = useRadio();
  const { stations, currentStation, nowPlaying, tune, radioOff } = radio;

  const [wheel, setWheel] = useState<WheelMode>("closed");
  const [highlight, setHighlight] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);
  const [title, setTitle] = useState({ name: "", tick: 0 });
  const [devices, setDevices] = useState<Device[]>([]);

  const slots: WheelSlot[] = [null, ...stations];
  const slotsRef = useRef(slots);
  const highlightRef = useRef(highlight);
  const wheelRef = useRef(wheel);
  useEffect(() => {
    slotsRef.current = slots;
    highlightRef.current = highlight;
    wheelRef.current = wheel;
  });

  const currentIndex = currentStation ? stations.findIndex((s) => s.id === currentStation.id) + 1 : 0;
  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  });

  const showTitle = (index: number) => {
    const slot = slotsRef.current[index];
    setTitle((t) => ({ name: slot ? slot.name : "Radio Off", tick: t.tick + 1 }));
  };

  const tapTarget = useRef<number | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pick = useCallback(
    (index: number) => {
      clearTimeout(tapTimer.current);
      tapTarget.current = null;
      setWheel("closed");
      const slot = slotsRef.current[index];
      if (slot === undefined) return;
      if (slot === null) void radioOff();
      else void tune(slot);
      showTitle(index);
    },
    [tune, radioOff],
  );

  /** Move one station clockwise (+1) or anticlockwise (-1); Radio Off is part of the loop, like in the game. */
  const step = useCallback((dir: 1 | -1) => {
    const n = slotsRef.current.length;
    const next = ((tapTarget.current ?? currentIndexRef.current) + dir + n) % n;
    tapTarget.current = next;
    showTitle(next);
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => pick(next), TAP_SETTLE_MS);
  }, [pick]);

  const openWheel = useCallback(
    (mode: WheelMode) => {
      setHighlight(currentIndex);
      setWheel(mode);
    },
    [currentIndex],
  );

  // Tap Q/Tab: next station clockwise. Hold Q/Tab: wheel; aim with mouse or scroll, release to tune.
  useEffect(() => {
    const isWheelKey = (e: KeyboardEvent) => e.key === "q" || e.key === "Q" || e.key === "Tab";
    const typing = () =>
      document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLSelectElement;
    let pressed = false;
    const down = (e: KeyboardEvent) => {
      if (typing() || managerOpen) return;
      if (e.key === "Escape") return setWheel("closed");
      if (!isWheelKey(e)) return;
      e.preventDefault();
      if (e.repeat || pressed || wheelRef.current !== "closed") return;
      pressed = true;
      holdTimer.current = setTimeout(() => {
        holdTimer.current = undefined;
        // Start the wheel from wherever rapid taps had got to.
        const from = tapTarget.current ?? currentIndexRef.current;
        clearTimeout(tapTimer.current);
        tapTarget.current = null;
        setHighlight(from);
        setWheel("hold");
      }, HOLD_MS);
    };
    const up = (e: KeyboardEvent) => {
      if (!isWheelKey(e) || !pressed) return;
      pressed = false;
      if (holdTimer.current !== undefined) {
        clearTimeout(holdTimer.current);
        holdTimer.current = undefined;
        step(1);
      } else if (wheelRef.current === "hold") {
        pick(highlightRef.current);
      }
    };
    const wheelScroll = (e: WheelEvent) => {
      if (wheelRef.current === "closed" || managerOpen) return;
      const n = slotsRef.current.length;
      setHighlight((h) => (h + (e.deltaY > 0 ? 1 : -1) + n) % n);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("wheel", wheelScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("wheel", wheelScroll);
      clearTimeout(holdTimer.current);
    };
  }, [pick, step, managerOpen]);

  useEffect(() => () => clearTimeout(tapTimer.current), []);

  const refreshDevices = useCallback(async () => {
    try {
      setDevices(await listDevices());
    } catch {
      setDevices([]);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load device list for Connect mode
    if (radio.mode === "connect") void refreshDevices();
  }, [radio.mode, refreshDevices]);

  const playing = !!currentStation && !!nowPlaying && !nowPlaying.paused;

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* backdrop: blurred album art tinted with the station color */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-colors duration-1000"
        style={{
          background: `radial-gradient(120% 90% at 50% 110%, ${currentStation?.color ?? "#1f2937"}55, transparent 60%), #07080a`,
        }}
      />
      {nowPlaying?.albumArt && currentStation && (
        <div
          className="pointer-events-none absolute inset-0 -z-10 scale-110 bg-cover bg-center opacity-20 blur-3xl"
          style={{ backgroundImage: `url(${nowPlaying.albumArt})` }}
        />
      )}

      <StationTitle name={title.name} tick={title.tick} />

      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-xl uppercase tracking-widest text-white/80">Los Santos Radio</span>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-white/50 hover:text-white">Log out</button>
        </form>
      </header>

      {/* now playing */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <button
          onClick={() => openWheel("sticky")}
          className="group relative aspect-square w-56 overflow-hidden rounded-full border-4 shadow-2xl transition-transform hover:scale-105 sm:w-72"
          style={{ borderColor: currentStation?.color ?? "#333" }}
          aria-label="Open station wheel"
        >
          {nowPlaying?.albumArt && currentStation ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art
            <img src={nowPlaying.albumArt} alt="" className={`h-full w-full object-cover ${playing ? "animate-spin-slow" : ""}`} />
          ) : currentStation?.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- station cover while tuning
            <img src={currentStation.image} alt="" className="h-full w-full object-cover opacity-70" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-neutral-900 font-display text-2xl uppercase text-white/60">
              {currentStation ? "Tuning…" : "Pick a station"}
            </span>
          )}
          <span className="absolute inset-0 m-auto h-8 w-8 rounded-full border-4 border-black/60 bg-neutral-800" />
        </button>

        <div className="min-h-[4.5rem]">
          {currentStation ? (
            <>
              <div className="font-display text-3xl uppercase tracking-wide" style={{ color: currentStation.color }}>
                {currentStation.name}
              </div>
              {nowPlaying && nowPlaying.contextUri?.endsWith(currentStation.playlistId) ? (
                <div className="mt-1 text-white/80">
                  <span className="font-semibold">{nowPlaying.name}</span>
                  <span className="text-white/50"> — {nowPlaying.artists}</span>
                </div>
              ) : (
                <div className="mt-1 text-white/50">{radio.tuning ? "Tuning in…" : " "}</div>
              )}
            </>
          ) : (
            <div className="text-white/50">
              Tap <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white">Q</kbd> /{" "}
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-white">Tab</kbd> for the next station, hold it for the
              radio wheel, or click the disc.
            </div>
          )}
        </div>

        {radio.error && (
          <div className="flex max-w-md items-start gap-3 rounded-xl border border-red-400/30 bg-red-950/60 px-4 py-3 text-left text-sm text-red-100">
            <span className="flex-1">{radio.error}</span>
            <button onClick={radio.clearError} className="text-red-200/70 hover:text-white" aria-label="Dismiss error">
              ✕
            </button>
          </div>
        )}
      </section>

      <ControlBar
        station={currentStation}
        nowPlaying={nowPlaying}
        playing={playing}
        tuning={radio.tuning}
        onPlayToggle={() => (playing ? void radioOff() : currentStation ? void tune(currentStation) : openWheel("sticky"))}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        volume={radio.volume}
        onVolume={radio.setVolume}
        mode={radio.mode}
        onMode={radio.setMode}
        devices={devices}
        deviceId={radio.deviceId}
        onDevice={radio.setDeviceId}
        onRefreshDevices={refreshDevices}
        onOpenStations={() => setManagerOpen(true)}
      />

      {wheel !== "closed" && (
        <RadioWheel
          slots={slots}
          highlight={highlight}
          currentId={currentStation?.id ?? null}
          nowLine={
            nowPlaying && currentStation && nowPlaying.contextUri?.endsWith(currentStation.playlistId)
              ? { name: nowPlaying.name, artists: nowPlaying.artists }
              : null
          }
          onHover={setHighlight}
          onPick={pick}
          onDismiss={() => setWheel("closed")}
        />
      )}

      {managerOpen && (
        <StationManager
          stations={stations}
          hiddenCount={radio.hiddenCount}
          onAdd={radio.addCustomStation}
          onRemove={radio.removeStation}
          onReset={radio.resetStations}
          onClose={() => setManagerOpen(false)}
        />
      )}
    </main>
  );
}
