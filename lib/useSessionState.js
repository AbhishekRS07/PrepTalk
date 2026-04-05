"use client";

import { useState, useCallback } from "react";

/**
 * Works exactly like useState but persists to sessionStorage.
 * Survives tab switches and navigation within the session.
 * Clears when the browser tab is closed.
 */
export function useSessionState(key, initialValue) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setPersistedState = useCallback(
    (value) => {
      setState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        try {
          sessionStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [state, setPersistedState];
}

/**
 * Same as useSessionState but for Sets.
 * Serialises as an array in sessionStorage.
 */
export function useSessionSet(key) {
  const [arr, setArr] = useSessionState(key, []);
  const set = new Set(arr);

  const setSet = useCallback(
    (updater) => {
      setArr((prevArr) => {
        const prevSet = new Set(prevArr);
        const next = typeof updater === "function" ? updater(prevSet) : updater;
        return [...next];
      });
    },
    [setArr]
  );

  return [set, setSet];
}
