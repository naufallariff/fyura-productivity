"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { BUNDLE_IDS, BUNDLES, MODES, type BundleId, type Mode } from "@/lib/theme/bundles";
import type { ThemeSelection } from "@/lib/theme/resolve";
import { t } from "@/lib/i18n";
import { saveThemeAction, type ThemeActionState } from "./actions";

const INITIAL: ThemeActionState = { status: "idle" };

export function ThemePicker({ current }: { current: ThemeSelection }) {
  const [state, action, pending] = useActionState(saveThemeAction, INITIAL);

  return (
    <form action={action} className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("settings.bundle")}</legend>
        <p className="text-ink-muted text-xs leading-relaxed">{t("settings.bundle.hint")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {BUNDLE_IDS.map((id) => (
            <BundleOption key={id} id={id} checked={current.bundle === id} />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("settings.mode")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((mode) => (
            <ModeOption key={mode} mode={mode} checked={current.mode === mode} />
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p role="status" aria-live="polite" className="text-ink-muted text-sm">
          {state.status === "saved" && t("settings.saved")}
          {state.status === "error" && <span className="text-negative">{state.message}</span>}
        </p>
        <Button type="submit" pending={pending}>
          {t("settings.save")}
        </Button>
      </div>
    </form>
  );
}

function BundleOption({ id, checked }: { id: BundleId; checked: boolean }) {
  const bundle = BUNDLES[id];
  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        name="bundle"
        value={id}
        defaultChecked={checked}
        className="peer sr-only"
      />
      <span className="glass ease-spring peer-checked:ring-accent peer-focus-visible:ring-accent flex h-full flex-col gap-3 p-4 transition-transform duration-200 peer-checked:ring-2 peer-focus-visible:ring-2 motion-safe:active:scale-[0.98]">
        <span className="text-sm font-medium">{bundle.label}</span>
        <span className="flex gap-1.5" aria-hidden>
          <span
            className="border-line size-6 rounded-full border"
            style={{ background: bundle.light.canvas }}
          />
          <span
            className="border-line size-6 rounded-full border"
            style={{ background: bundle.light.glow[0] }}
          />
          <span
            className="border-line size-6 rounded-full border"
            style={{ background: bundle.light.accent }}
          />
        </span>
      </span>
    </label>
  );
}

function ModeOption({ mode, checked }: { mode: Mode; checked: boolean }) {
  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        name="mode"
        value={mode}
        defaultChecked={checked}
        className="peer sr-only"
      />
      <span className="glass ease-spring peer-checked:ring-accent peer-focus-visible:ring-accent flex min-h-11 items-center p-4 text-sm font-medium transition-transform duration-200 peer-checked:ring-2 peer-focus-visible:ring-2 motion-safe:active:scale-[0.98]">
        {t(`settings.mode.${mode}`)}
      </span>
    </label>
  );
}
