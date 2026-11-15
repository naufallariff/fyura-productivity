"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { clearClientSession } from "@/client/query/session";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";

/** Clears the client cache before the server ends the session, so no data survives into the next user's session. */
export function SignOutButton({ className }: { className?: string }) {
  const client = useQueryClient();

  return (
    <form action={signOutAction} onSubmit={() => clearClientSession(client)}>
      <button
        type="submit"
        className={cn(
          "rounded-control text-ink-muted hover:bg-accent-soft hover:text-ink focus-visible:ring-accent flex min-h-11 w-full items-center gap-3 px-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-2",
          className,
        )}
      >
        <LogOut aria-hidden className="size-4" strokeWidth={1.75} />
        {t("shell.signOut")}
      </button>
    </form>
  );
}
