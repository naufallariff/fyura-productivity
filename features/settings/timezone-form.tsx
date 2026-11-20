"use client";

import { useActionState, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { t } from "@/lib/i18n";
import { saveTimeZoneAction, type TimeZoneActionState } from "./timezone-actions";

const SELECT =
  "min-h-11 w-full rounded-control border border-line bg-[var(--glass-solid)] px-3.5 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm";

const FALLBACK_ZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Europe/London",
  "America/New_York",
  "UTC",
];

const INITIAL: TimeZoneActionState = { status: "idle" };

let cachedZones: string[] | null = null;

/** Zones the browser supports. Computed once, so the snapshot stays stable between renders. */
function clientZones(): string[] {
  if (cachedZones === null) {
    const intl = Intl as unknown as { supportedValuesOf?: (key: "timeZone") => string[] };
    cachedZones = intl.supportedValuesOf?.("timeZone") ?? FALLBACK_ZONES;
  }
  return cachedZones;
}

function deviceZone(): string | null {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
}

const subscribe = () => () => {};

export function TimeZoneForm({ current }: { readonly current: string }) {
  const [state, formAction, pending] = useActionState(saveTimeZoneAction, INITIAL);
  const [value, setValue] = useState(current);

  const serverList = useMemo(() => [current], [current]);
  const zones = useSyncExternalStore(subscribe, clientZones, () => serverList);
  const device = useSyncExternalStore(subscribe, deviceZone, () => null);

  const options = zones.includes(value) ? zones : [value, ...zones];

  const message =
    state.status === "saved"
      ? t("settings.timezone.saved")
      : state.status === "error"
        ? state.code === "VALIDATION_FAILED"
          ? t("settings.timezone.invalid")
          : t("settings.timezone.error")
        : "";

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">{t("settings.timezone.title")}</h2>
        <p className="text-ink-muted text-xs leading-relaxed">{t("settings.timezone.lead")}</p>
      </div>

      <Field id="timezone" label={t("settings.timezone.label")}>
        <select
          id="timezone"
          name="timeZone"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={SELECT}
        >
          {options.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </Field>

      {device !== null && device !== value && (
        <Button type="button" variant="secondary" size="sm" onClick={() => setValue(device)}>
          {t("settings.timezone.useDevice", { zone: device })}
        </Button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p role="status" aria-live="polite" className="text-ink-muted text-sm">
          {message}
        </p>
        <Button type="submit" pending={pending}>
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
