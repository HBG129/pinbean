import { useState } from "react";

export function useHistoryState<T>(initialValue: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialValue);
  const [future, setFuture] = useState<T[]>([]);

  function set(value: T) {
    setPast((prev) => [...prev, present]);
    setPresent(value);
    setFuture([]);
  }

  function reset(value: T) {
    setPast([]);
    setPresent(value);
    setFuture([]);
  }

  function undo() {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prev) => [present, ...prev]);
    setPresent(previous);
    setPast(newPast);
  }

  function redo() {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, present]);
    setPresent(next);
    setFuture(newFuture);
  }

  return {
    value: present,
    set,
    reset,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}