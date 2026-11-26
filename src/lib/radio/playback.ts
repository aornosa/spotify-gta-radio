"use client";

import { getAccessToken, spotify } from "@/lib/spotify/client";

export type PlaybackMode = "sdk" | "connect";

export interface NowPlaying {
  trackUri: string;
  name: string;
  artists: string;
  albumArt?: string;
  durationMs: number;
  positionMs: number;
  paused: boolean;
  contextUri: string | null;
  /** Wall-clock ms at which positionMs was measured. */
  at: number;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export interface PlaybackAdapter {
  readonly mode: PlaybackMode;
  /** Resolves with the device id to send playback to; throws if none is usable. */
  getDeviceId(): Promise<string>;
  onState(cb: (s: NowPlaying | null) => void): () => void;
  onError(cb: (message: string) => void): () => void;
  /** Must be called from a user gesture (unlocks audio on mobile browsers). */
  activate(): Promise<void>;
  setVolume(v: number): Promise<void>;
  destroy(): void;
}

class Emitter<T> {
  private subs = new Set<(v: T) => void>();
  on(cb: (v: T) => void) {
    this.subs.add(cb);
    return () => void this.subs.delete(cb);
  }
  emit(v: T) {
    for (const cb of this.subs) cb(v);
  }
}

// ---------------------------------------------------------------- In-browser (Web Playback SDK)

let sdkReady: Promise<void> | null = null;
function loadSdk(): Promise<void> {
  sdkReady ??= new Promise((resolve, reject) => {
    if (window.Spotify) return resolve();
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const s = document.createElement("script");
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.async = true;
    s.onerror = () => {
      sdkReady = null;
      reject(new Error("Couldn't load the Spotify Web Playback SDK."));
    };
    document.body.appendChild(s);
  });
  return sdkReady;
}

export class SdkAdapter implements PlaybackAdapter {
  readonly mode = "sdk" as const;
  private player: Spotify.Player | null = null;
  private deviceId: Promise<string>;
  private states = new Emitter<NowPlaying | null>();
  private errors = new Emitter<string>();

  constructor() {
    this.deviceId = this.init();
    // Avoid unhandled-rejection noise; callers see the error via getDeviceId().
    this.deviceId.catch(() => {});
  }

  private async init(): Promise<string> {
    await loadSdk();
    const player = new window.Spotify.Player({
      name: "Los Santos Radio (web)",
      getOAuthToken: (cb) => void getAccessToken().then(cb, () => {}),
      volume: 0.8,
    });
    this.player = player;

    player.addListener("player_state_changed", (s) => this.states.emit(s ? fromSdkState(s) : null));
    const fail = (label: string) => ({ message }: Spotify.Error) => this.errors.emit(`${label}: ${message}`);
    player.addListener("authentication_error", fail("Spotify authentication failed"));
    player.addListener("playback_error", fail("Playback error"));
    player.addListener("account_error", () =>
      this.errors.emit("Spotify Premium is required for in-browser playback."),
    );

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("The in-browser player didn't start in time.")), 15_000);
      player.addListener("ready", ({ device_id }) => {
        clearTimeout(timer);
        resolve(device_id);
      });
      player.addListener("initialization_error", ({ message }) => {
        clearTimeout(timer);
        reject(new Error(`This browser can't play Spotify audio: ${message}`));
      });
      player.addListener("account_error", () => {
        clearTimeout(timer);
        reject(new Error("Spotify Premium is required for in-browser playback."));
      });
      player.connect().then((ok) => {
        if (!ok) {
          clearTimeout(timer);
          reject(new Error("Couldn't connect the in-browser Spotify player."));
        }
      });
    });
  }

  getDeviceId() {
    return this.deviceId;
  }
  onState(cb: (s: NowPlaying | null) => void) {
    return this.states.on(cb);
  }
  onError(cb: (m: string) => void) {
    return this.errors.on(cb);
  }
  async activate() {
    await this.player?.activateElement();
  }
  async setVolume(v: number) {
    await this.player?.setVolume(v);
  }
  destroy() {
    this.player?.disconnect();
    this.player = null;
  }
}

function fromSdkState(s: Spotify.PlaybackState): NowPlaying {
  const t = s.track_window.current_track;
  return {
    trackUri: t.uri,
    name: t.name,
    artists: t.artists.map((a) => a.name).join(", "),
    albumArt: t.album.images[0]?.url,
    durationMs: s.duration,
    positionMs: s.position,
    paused: s.paused,
    contextUri: s.context?.uri ?? null,
    // Use the local clock (not the SDK's timestamp) so snapshots compare consistently.
    at: Date.now(),
  };
}

// ---------------------------------------------------------------- Remote control (Spotify Connect)

interface ApiPlayer {
  is_playing: boolean;
  progress_ms: number | null;
  context: { uri: string } | null;
  device: { id: string | null; volume_percent: number | null };
  item: {
    uri: string;
    name: string;
    duration_ms: number;
    artists?: { name: string }[];
    album?: { images: { url: string }[] };
  } | null;
}

export async function listDevices(): Promise<Device[]> {
  const res = await spotify<{
    devices: { id: string | null; name: string; type: string; is_active: boolean; is_restricted: boolean }[];
  }>("/me/player/devices");
  return (res?.devices ?? [])
    .filter((d) => d.id && !d.is_restricted && !d.name.startsWith("Los Santos Radio"))
    .map((d) => ({ id: d.id!, name: d.name, type: d.type, isActive: d.is_active }));
}

export class ConnectAdapter implements PlaybackAdapter {
  readonly mode = "connect" as const;
  private states = new Emitter<NowPlaying | null>();
  private errors = new Emitter<string>();
  private timer: ReturnType<typeof setInterval>;

  constructor(private getSelectedDevice: () => string | null) {
    this.timer = setInterval(() => void this.poll(), 3_000);
    void this.poll();
  }

  private async poll() {
    try {
      const p = await spotify<ApiPlayer>("/me/player");
      if (!p?.item) return this.states.emit(null);
      this.states.emit({
        trackUri: p.item.uri,
        name: p.item.name,
        artists: (p.item.artists ?? []).map((a) => a.name).join(", "),
        albumArt: p.item.album?.images[0]?.url,
        durationMs: p.item.duration_ms,
        positionMs: p.progress_ms ?? 0,
        paused: !p.is_playing,
        contextUri: p.context?.uri ?? null,
        at: Date.now(),
      });
    } catch {
      // Polling errors are transient; tune() surfaces real failures.
    }
  }

  async getDeviceId() {
    const selected = this.getSelectedDevice();
    const devices = await listDevices();
    const device = devices.find((d) => d.id === selected) ?? devices.find((d) => d.isActive) ?? devices[0];
    if (!device) throw new Error("No Spotify devices found. Open Spotify on your phone or computer first.");
    return device.id;
  }
  onState(cb: (s: NowPlaying | null) => void) {
    return this.states.on(cb);
  }
  onError(cb: (m: string) => void) {
    return this.errors.on(cb);
  }
  async activate() {}
  async setVolume(v: number) {
    await spotify("/me/player/volume", {
      method: "PUT",
      query: { volume_percent: String(Math.round(v * 100)) },
    }).catch(() => {});
  }
  /** Poll soon after a command so the UI updates quickly. */
  refreshSoon() {
    setTimeout(() => void this.poll(), 800);
  }
  destroy() {
    clearInterval(this.timer);
  }
}
