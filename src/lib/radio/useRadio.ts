"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_STATIONS, type Station } from "@/data/stations";
import { describeError, spotify, SpotifyError } from "@/lib/spotify/client";
import { randomStartPosition, whereIsStationNow, type StationSnapshot } from "./broadcast";
import {
  ConnectAdapter,
  SdkAdapter,
  type NowPlaying,
  type PlaybackAdapter,
  type PlaybackMode,
} from "./playback";
import { useLocalStorage } from "./useLocalStorage";

const KEYS = {
  snapshots: "gta-radio:snapshots",
  custom: "gta-radio:custom-stations",
  hidden: "gta-radio:hidden-stations",
  mode: "gta-radio:mode",
  device: "gta-radio:device",
  volume: "gta-radio:volume",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const contextUriOf = (s: Station) => `spotify:playlist:${s.playlistId}`;

interface QueueResponse {
  currently_playing: { uri: string } | null;
  queue: { uri: string; duration_ms: number; type: string }[];
}

export function useRadio() {
  const [customStations, setCustomStations] = useLocalStorage<Station[]>(KEYS.custom, []);
  const [hidden, setHidden] = useLocalStorage<string[]>(KEYS.hidden, []);
  const [mode, setMode, modeLoaded] = useLocalStorage<PlaybackMode>(KEYS.mode, "sdk");
  const [deviceId, setDeviceId] = useLocalStorage<string | null>(KEYS.device, null);
  const [volume, setVolumeState] = useLocalStorage<number>(KEYS.volume, 0.8);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tuning, setTuning] = useState(false);

  const stations = useMemo(
    () => [...DEFAULT_STATIONS.filter((s) => !hidden.includes(s.id)), ...customStations],
    [hidden, customStations],
  );

  // Refs used inside async flows / event handlers so they always see fresh values.
  const adapterRef = useRef<PlaybackAdapter | null>(null);
  const stationsRef = useRef(stations);
  const currentRef = useRef<string | null>(null);
  const deviceRef = useRef(deviceId);
  const volumeRef = useRef(volume);
  const tuneSeq = useRef(0);
  const pendingSeek = useRef<{ seq: number; contextUri: string; after: number } | null>(null);
  /** After resuming a station: where the song should be, to correct Spotify if it starts elsewhere. */
  const pendingResume = useRef<{ trackUri: string; positionMs: number; at: number } | null>(null);
  const lastState = useRef<NowPlaying | null>(null);
  const queueTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const snapshots = useRef<Record<string, StationSnapshot>>({});

  useEffect(() => {
    stationsRef.current = stations;
    deviceRef.current = deviceId;
    volumeRef.current = volume;
  }, [stations, deviceId, volume]);

  useEffect(() => {
    try {
      snapshots.current = JSON.parse(localStorage.getItem(KEYS.snapshots) ?? "{}");
    } catch {
      snapshots.current = {};
    }
  }, []);
  const persistSnapshots = useCallback(() => {
    localStorage.setItem(KEYS.snapshots, JSON.stringify(snapshots.current));
  }, []);

  const currentStation = () => stationsRef.current.find((s) => s.id === currentRef.current);

  /** Ask Spotify what plays next on this station, so we can keep the broadcast going while away. */
  const scheduleQueueFetch = useCallback(
    (stationId: string, delay = 1500) => {
      clearTimeout(queueTimer.current);
      queueTimer.current = setTimeout(async () => {
        if (currentRef.current !== stationId) return;
        try {
          const q = await spotify<QueueResponse>("/me/player/queue");
          const snap = snapshots.current[stationId];
          if (!q || !snap || q.currently_playing?.uri !== snap.trackUri) return;
          snap.upcoming = q.queue
            .filter((t) => t.type === "track" || t.type === "episode")
            .map((t) => ({ uri: t.uri, durationMs: t.duration_ms }));
          persistSnapshots();
        } catch {
          // Without the queue the station simply starts fresh next time.
        }
      }, delay);
    },
    [persistSnapshots],
  );

  const handleState = useCallback(
    (s: NowPlaying | null) => {
      setNowPlaying(s);
      lastState.current = s;
      const station = currentStation();
      if (!s || !station || s.contextUri !== contextUriOf(station)) return;

      // Resumed station: if Spotify started the song somewhere else (e.g. from 0), seek to where it should be.
      const r = pendingResume.current;
      if (r && s.trackUri === r.trackUri) {
        pendingResume.current = null;
        const expected = r.positionMs + (Date.now() - r.at);
        if (Math.abs(s.positionMs - expected) > 4000 && expected < s.durationMs - 5000) {
          void spotify("/me/player/seek", { method: "PUT", query: { position_ms: String(Math.round(expected)) } }).catch(() => {});
          return;
        }
      }

      // Fresh tune-in: once the shuffled song has started, jump to a random point in it.
      const p = pendingSeek.current;
      if (p && p.contextUri === s.contextUri && s.at >= p.after && s.durationMs > 0) {
        pendingSeek.current = null;
      pendingResume.current = null;
        const pos = randomStartPosition(s.durationMs);
        void (async () => {
          try {
            await spotify("/me/player/seek", { method: "PUT", query: { position_ms: String(pos) } });
          } finally {
            if (adapterRef.current?.mode === "sdk") await adapterRef.current.setVolume(volumeRef.current);
          }
        })();
        return;
      }
      if (s.paused) return; // Broadcast keeps "playing" while paused; don't freeze the snapshot.

      const prev = snapshots.current[station.id];
      const trackChanged = prev?.trackUri !== s.trackUri;
      let upcoming = prev?.upcoming ?? [];
      if (trackChanged) {
        const i = upcoming.findIndex((t) => t.uri === s.trackUri);
        upcoming = i >= 0 ? upcoming.slice(i + 1) : [];
      }
      snapshots.current[station.id] = {
        trackUri: s.trackUri,
        durationMs: s.durationMs,
        positionMs: s.positionMs,
        at: s.at,
        upcoming,
      };
      persistSnapshots();
      if (trackChanged) scheduleQueueFetch(station.id);
    },
    [persistSnapshots, scheduleQueueFetch],
  );

  // (Re)create the playback adapter whenever the mode changes.
  useEffect(() => {
    if (!modeLoaded) return;
    const adapter: PlaybackAdapter =
      mode === "sdk" ? new SdkAdapter() : new ConnectAdapter(() => deviceRef.current);
    adapterRef.current = adapter;
    const offState = adapter.onState(handleState);
    const offError = adapter.onError(setError);
    if (mode === "sdk") adapter.getDeviceId().catch((e) => setError(describeError(e)));
    return () => {
      offState();
      offError();
      adapter.destroy();
      if (adapterRef.current === adapter) adapterRef.current = null;
    };
  }, [mode, modeLoaded, handleState]);

  const tune = useCallback(
    async (station: Station) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      // Already tuned in and playing this station: nothing to do (don't restart the song).
      const now = lastState.current;
      if (
        currentRef.current === station.id &&
        now &&
        !now.paused &&
        now.contextUri === contextUriOf(station)
      ) {
        return;
      }
      const seq = ++tuneSeq.current;
      const stale = () => seq !== tuneSeq.current;
      currentRef.current = station.id;
      setCurrentId(station.id);
      setError(null);
      setTuning(true);
      pendingSeek.current = null;

      try {
        await adapter.activate();
        const device_id = await adapter.getDeviceId();
        if (stale()) return;
        const context_uri = contextUriOf(station);
        const snap = snapshots.current[station.id];
        const target = snap ? whereIsStationNow(snap, Date.now()) : { kind: "fresh" as const };

        let resumed = false;
        if (target.kind === "resume") {
          try {
            await spotify("/me/player/play", {
              method: "PUT",
              query: { device_id },
              body: JSON.stringify({
                context_uri,
                offset: { uri: target.trackUri },
                position_ms: target.positionMs,
              }),
            });
            resumed = true;
            pendingResume.current = { trackUri: target.trackUri, positionMs: target.positionMs, at: Date.now() };
            setTimeout(() => {
              if (pendingResume.current?.trackUri === target.trackUri) pendingResume.current = null;
            }, 6000);
          } catch (e) {
            // The song may have left the playlist; anything else is a real error.
            if (!(e instanceof SpotifyError) || ![400, 404].includes(e.status)) throw e;
            if (e.reason === "NO_ACTIVE_DEVICE") throw e;
          }
        }

        if (!resumed) {
          delete snapshots.current[station.id];
          // Start the playlist, then shuffle + skip so we land on a random song.
          if (adapter.mode === "sdk") await adapter.setVolume(0);
          await spotify("/me/player/play", { method: "PUT", query: { device_id }, body: JSON.stringify({ context_uri }) });
          await sleep(400);
          if (stale()) return;
          await spotify("/me/player/shuffle", { method: "PUT", query: { state: "true", device_id } });
          await spotify("/me/player/next", { method: "POST", query: { device_id } });
          pendingSeek.current = { seq, contextUri: context_uri, after: Date.now() };
          // Safety net: never leave the in-browser player muted.
          setTimeout(() => {
            if (pendingSeek.current?.seq === seq) {
              pendingSeek.current = null;
              void adapterRef.current?.setVolume(volumeRef.current);
            }
          }, 4000);
        }

        if (adapter instanceof ConnectAdapter) adapter.refreshSoon();
        scheduleQueueFetch(station.id, 2500);
      } catch (e) {
        if (!stale()) setError(describeError(e));
        void adapter.setVolume(volumeRef.current);
      } finally {
        if (!stale()) setTuning(false);
      }
    },
    [scheduleQueueFetch],
  );

  const radioOff = useCallback(async () => {
    tuneSeq.current++;
    currentRef.current = null;
    setCurrentId(null);
    setTuning(false);
    try {
      await spotify("/me/player/pause", { method: "PUT" });
    } catch {
      // Already paused / no device: nothing to do.
    }
  }, []);

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
      void adapterRef.current?.setVolume(v);
    },
    [setVolumeState],
  );

  const addCustomStation = useCallback(
    async (playlistId: string) => {
      const meta = await spotify<{
        name: string;
        owner?: { display_name?: string };
        images?: { url: string; width: number | null }[] | null;
      }>(`/playlists/${playlistId}`, { query: { fields: "name,owner.display_name,images" } });
      const image = [...(meta?.images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url;
      const name = meta?.name ?? "Custom station";
      const station: Station = {
        id: `custom-${playlistId}`,
        name,
        short: name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 4).toUpperCase() || "MIX",
        genre: meta?.owner?.display_name ? `by ${meta.owner.display_name}` : "Custom",
        color: `hsl(${Math.floor(Math.random() * 360)} 65% 50%)`,
        playlistId,
        image,
        custom: true,
      };
      setCustomStations((list) => [...list.filter((s) => s.id !== station.id), station]);
      return station;
    },
    [setCustomStations],
  );

  const removeStation = useCallback(
    (station: Station) => {
      if (station.custom) setCustomStations((list) => list.filter((s) => s.id !== station.id));
      else setHidden((h) => [...new Set([...h, station.id])]);
      delete snapshots.current[station.id];
      persistSnapshots();
    },
    [setCustomStations, setHidden, persistSnapshots],
  );

  const resetStations = useCallback(() => {
    setHidden([]);
  }, [setHidden]);

  return {
    stations,
    customStations,
    hiddenCount: hidden.length,
    currentStation: stations.find((s) => s.id === currentId) ?? null,
    nowPlaying,
    error,
    tuning,
    mode,
    setMode,
    deviceId,
    setDeviceId,
    volume,
    setVolume,
    tune,
    radioOff,
    addCustomStation,
    removeStation,
    resetStations,
    clearError: () => setError(null),
  };
}
