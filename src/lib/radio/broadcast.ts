/**
 * Per-listener "live broadcast" clock.
 *
 * Spotify won't give us the track list of playlists we don't own, so instead of a
 * global schedule we remember, per station, what was playing when we left it plus
 * the upcoming songs Spotify's queue reported. When the listener returns, we walk
 * the elapsed time forward through those songs to find where the station "is now".
 */

export interface QueuedTrack {
  uri: string;
  durationMs: number;
}

export interface StationSnapshot {
  /** Track that was playing when the snapshot was taken. */
  trackUri: string;
  durationMs: number;
  positionMs: number;
  /** Wall-clock time (ms) the snapshot refers to. */
  at: number;
  /** Songs Spotify said would play next, in order. */
  upcoming: QueuedTrack[];
}

export type TuneTarget =
  | { kind: "resume"; trackUri: string; positionMs: number }
  /** Ran past everything we know about: start fresh at a random point. */
  | { kind: "fresh" };

/** Don't drop the listener into the last few seconds of a song. */
const MIN_REMAINING_MS = 8_000;

export function whereIsStationNow(snap: StationSnapshot, now: number): TuneTarget {
  let elapsed = Math.max(0, now - snap.at);
  const tracks: QueuedTrack[] = [{ uri: snap.trackUri, durationMs: snap.durationMs }, ...snap.upcoming];
  let offset = Math.min(snap.positionMs, snap.durationMs);

  for (const t of tracks) {
    const remaining = t.durationMs - offset;
    if (elapsed < remaining) {
      const positionMs = offset + elapsed;
      if (t.durationMs - positionMs >= MIN_REMAINING_MS) {
        return { kind: "resume", trackUri: t.uri, positionMs: Math.round(positionMs) };
      }
      // Too close to the end: roll into the start of the next song instead.
      elapsed = remaining;
    }
    elapsed -= remaining;
    offset = 0;
  }
  return { kind: "fresh" };
}

/** Random starting position for a fresh tune-in: somewhere in the first 80% of the song. */
export function randomStartPosition(durationMs: number, rand: () => number = Math.random): number {
  if (durationMs <= MIN_REMAINING_MS * 2) return 0;
  return Math.floor(rand() * durationMs * 0.8);
}
