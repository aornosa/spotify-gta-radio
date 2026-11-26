"use client";

import { useCallback, useEffect, useState } from "react";

/** useState that persists to localStorage (read after mount to stay SSR-safe). */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Corrupt value: keep the default.
    }
    setLoaded(true);
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        localStorage.setItem(key, JSON.stringify(v));
        return v;
      });
    },
    [key],
  );

  return [value, set, loaded] as const;
}
