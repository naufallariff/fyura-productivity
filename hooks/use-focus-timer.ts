"use client";

import { useEffect, useState } from "react";

export function useFocusTimer() {
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60_000);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [completedMinutes, setCompletedMinutes] = useState(0);

  useEffect(() => {
    if (deadline === null) return;
    const interval = window.setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left === 0) {
        window.clearInterval(interval);
        setDeadline(null);
        setCompletedMinutes((total) => total + minutes);
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [deadline, minutes]);

  function configure(next: number) {
    setDeadline(null);
    setMinutes(next);
    setRemaining(next * 60_000);
  }

  function toggle() {
    if (deadline !== null) {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      setDeadline(null);
      if (left === 0) setCompletedMinutes((total) => total + minutes);
    } else {
      const left = remaining || minutes * 60_000;
      setRemaining(left);
      setDeadline(Date.now() + left);
    }
  }

  return {
    minutes,
    seconds: Math.ceil(remaining / 1000),
    running: deadline !== null,
    completedMinutes,
    configure,
    toggle,
  };
}
