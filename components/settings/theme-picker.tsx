"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { saveThemeAction, type ThemeActionState } from "@/app/actions/settings";
import { PALETTES } from "@/lib/theme/palettes";
import { STYLES } from "@/lib/theme/styles";
import type { ThemeSelection } from "@/lib/theme/resolve";

const MODES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
] as const;

const INITIAL: ThemeActionState = { status: "idle" };

export function ThemePicker({ current }: { current: ThemeSelection }) {
  const [state, action, pending] = useActionState(saveThemeAction, INITIAL);

  return (
    <form action={action} className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold tracking-tight">Surface style</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {STYLES.map((style) => (
            <OptionCard
              key={style.id}
              name="style"
              value={style.id}
              title={style.name}
              description={style.description}
              checked={current.style === style.id}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold tracking-tight">Color palette</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PALETTES.map((palette) => (
            <OptionCard
              key={palette.id}
              name="palette"
              value={palette.id}
              title={palette.name}
              swatches={[palette.dark.accent, palette.dark.surface, palette.dark.text]}
              checked={current.palette === palette.id}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold tracking-tight">Mode</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((mode) => (
            <OptionCard
              key={mode.id}
              name="mode"
              value={mode.id}
              title={mode.label}
              checked={current.mode === mode.id}
            />
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-4">
        <p role="status" aria-live="polite" className="text-muted text-sm">
          {state.status === "saved" && "Theme saved."}
          {state.status === "error" && <span className="text-danger">{state.message}</span>}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-control bg-accent text-on-accent ease-spring px-5 py-3 text-sm font-medium transition-transform duration-200 active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save theme"}
        </button>
      </div>
    </form>
  );
}

function OptionCard({
  name,
  value,
  title,
  description,
  swatches,
  checked,
}: {
  name: string;
  value: string;
  title: string;
  description?: string;
  swatches?: string[];
  checked: boolean;
}) {
  return (
    <label className="relative cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        className="peer sr-only"
      />
      <span className="rounded-card border-line bg-surface ease-spring peer-checked:border-accent peer-checked:ring-accent/30 flex h-full flex-col gap-3 border p-5 transition-transform duration-200 peer-checked:ring-2 active:scale-[0.98]">
        <span className="flex items-center justify-between">
          <span className="text-[15px] font-medium">{title}</span>
          <Check
            aria-hidden
            className="text-accent size-4 opacity-0 peer-checked:opacity-100"
            strokeWidth={2}
          />
        </span>
        {description && <span className="text-muted text-sm leading-relaxed">{description}</span>}
        {swatches && (
          <span className="flex gap-1.5">
            {swatches.map((color) => (
              <span
                key={color}
                className="border-line size-5 rounded-full border"
                style={{ background: color }}
              />
            ))}
          </span>
        )}
      </span>
    </label>
  );
}
