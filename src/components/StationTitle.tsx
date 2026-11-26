"use client";

import { useEffect, useState } from "react";

/** Big station name that flashes at the top of the screen when you change station. */
export function StationTitle({ name, tick }: { name: string; tick: number }) {
  const [visibleTick, setVisibleTick] = useState(-1);

  useEffect(() => {
    if (tick === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the title for each new tune
    setVisibleTick(tick);
    const t = setTimeout(() => setVisibleTick(-1), 3500);
    return () => clearTimeout(t);
  }, [tick]);

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 top-8 z-30 text-center font-display text-4xl uppercase tracking-wide text-white transition-opacity duration-700 [text-shadow:0_2px_0_#000,0_0_24px_rgba(0,0,0,0.8)] sm:text-6xl ${
        visibleTick === tick && tick > 0 ? "opacity-100" : "opacity-0"
      }`}
    >
      {name}
    </div>
  );
}
