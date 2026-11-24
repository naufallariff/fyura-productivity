"use client";

import { useEffect, useEffectEvent } from "react";
import { useSearchParams } from "next/navigation";
import { SHELL_COMMAND_PARAM, type ShellCommand } from "@/lib/shell/commands";

/** Consume a palette command only once the destination is ready to run it. */
export function useShellCommand(command: ShellCommand, run: () => void, ready = true): void {
  const requested = useSearchParams().get(SHELL_COMMAND_PARAM);
  const execute = useEffectEvent(run);

  useEffect(() => {
    if (!ready || requested !== command) return;

    const frame = requestAnimationFrame(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.get(SHELL_COMMAND_PARAM) !== command) return;
      url.searchParams.delete(SHELL_COMMAND_PARAM);
      window.history.replaceState(null, "", url);
      execute();
    });

    return () => cancelAnimationFrame(frame);
  }, [command, ready, requested]);
}
