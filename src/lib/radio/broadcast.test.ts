import { describe, expect, it } from "vitest";
import { randomStartPosition, whereIsStationNow, type StationSnapshot } from "./broadcast";

const MIN = 60_000;
const snap: StationSnapshot = {
  trackUri: "a",
  durationMs: 3 * MIN,
  positionMs: 1 * MIN,
  at: 1_000_000,
  upcoming: [
    { uri: "b", durationMs: 4 * MIN },
    { uri: "c", durationMs: 2 * MIN },
  ],
};

describe("whereIsStationNow", () => {
  it("resumes the same song when little time passed", () => {
    expect(whereIsStationNow(snap, snap.at + 30_000)).toEqual({
      kind: "resume", trackUri: "a", positionMs: 90_000,
    });
  });

  it("moves into the next song after the current one ends", () => {
    // 2 min left on "a", so 3 min later we're 1 min into "b".
    expect(whereIsStationNow(snap, snap.at + 3 * MIN)).toEqual({
      kind: "resume", trackUri: "b", positionMs: 1 * MIN,
    });
  });

  it("walks across several songs", () => {
    // 2 min (rest of a) + 4 min (b) + 30 s into c.
    expect(whereIsStationNow(snap, snap.at + 6 * MIN + 30_000)).toEqual({
      kind: "resume", trackUri: "c", positionMs: 30_000,
    });
  });

  it("skips to the next song instead of landing in the last seconds", () => {
    expect(whereIsStationNow(snap, snap.at + 2 * MIN - 3_000)).toEqual({
      kind: "resume", trackUri: "b", positionMs: 0,
    });
  });

  it("asks for a fresh start once past all known songs", () => {
    expect(whereIsStationNow(snap, snap.at + 9 * MIN)).toEqual({ kind: "fresh" });
  });

  it("is deterministic and ignores clocks going backwards", () => {
    const t = snap.at + 4 * MIN;
    expect(whereIsStationNow(snap, t)).toEqual(whereIsStationNow(snap, t));
    expect(whereIsStationNow(snap, snap.at - 5_000)).toEqual({
      kind: "resume", trackUri: "a", positionMs: 1 * MIN,
    });
  });
});

describe("randomStartPosition", () => {
  it("stays within the first 60% of the song", () => {
    expect(randomStartPosition(200_000, () => 0.999)).toBeLessThan(120_000);
    expect(randomStartPosition(200_000, () => 0)).toBe(0);
  });
  it("starts very short songs at 0", () => {
    expect(randomStartPosition(10_000, () => 0.5)).toBe(0);
  });
});
