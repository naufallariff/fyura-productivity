"use client";

import { useThemeSelection } from "@/components/shell/theme-mode";
import { BUNDLE_IDS, BUNDLES, MODES, type BundleId, type Mode } from "@/lib/theme/bundles";
import type { ThemeSelection } from "@/lib/theme/resolve";
import { t } from "@/lib/i18n";

export function ThemePicker({ current }: { current: ThemeSelection }) {
  const { selection, selectTheme, saveStatus } = useThemeSelection(current);

  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("settings.bundle")}</legend>
        <p className="text-ink-muted text-xs leading-relaxed">{t("settings.bundle.hint")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {BUNDLE_IDS.map((id) => (
            <BundleOption
              key={id}
              id={id}
              checked={selection.bundle === id}
              onSelect={() => selectTheme({ bundle: id })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("settings.mode")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((mode) => (
            <ModeOption
              key={mode}
              mode={mode}
              checked={selection.mode === mode}
              onSelect={() => selectTheme({ mode })}
            />
          ))}
        </div>
      </fieldset>

      <p role="status" className="text-ink-muted min-h-5 text-sm">
        {saveStatus === "saving" && t("settings.theme.saving")}
        {saveStatus === "saved" && t("settings.saved")}
        {saveStatus === "error" && (
          <span className="text-negative">{t("settings.theme.error")}</span>
        )}
      </p>
    </div>
  );
}

function BundleOption({
  id,
  checked,
  onSelect,
}: {
  id: BundleId;
  checked: boolean;
  onSelect: () => void;
}) {
  const bundle = BUNDLES[id];
  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        name="bundle"
        value={id}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span className="ease-spring peer-checked:ring-accent peer-focus-visible:ring-accent flex h-full flex-col gap-3 rounded-xl border border-(--border-subtle) bg-(--bg-surface) p-4 shadow-(--shadow-card) transition-transform duration-200 peer-checked:ring-2 peer-focus-visible:ring-2 motion-safe:active:scale-[0.98]">
        <span className="text-sm font-medium">{bundle.label}</span>
        <span data-theme={id} data-mode="light" className="flex gap-2" aria-hidden>
          <span className="border-line bg-canvas size-6 rounded-full border" />
          <span className="border-line bg-accent-soft size-6 rounded-full border" />
          <span className="border-line bg-accent size-6 rounded-full border" />
        </span>
      </span>
    </label>
  );
}

function ModeOption({
  mode,
  checked,
  onSelect,
}: {
  mode: Mode;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        name="mode"
        value={mode}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span className="ease-spring peer-checked:ring-accent peer-focus-visible:ring-accent flex min-h-11 items-center rounded-xl border border-(--border-subtle) bg-(--bg-surface) p-4 text-sm font-medium shadow-(--shadow-card) transition-transform duration-200 peer-checked:ring-2 peer-focus-visible:ring-2 motion-safe:active:scale-[0.98]">
        {t(`settings.mode.${mode}`)}
      </span>
    </label>
  );
}
