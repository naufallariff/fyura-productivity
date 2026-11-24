import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

const CONTROL =
  "w-full rounded-lg border border-(--border-control) bg-(--bg-surface) px-4 text-base text-ink outline-none transition-colors duration-150 placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-accent aria-[invalid=true]:border-negative disabled:opacity-50 sm:text-sm";

/** Text size is 16 px on phones so the browser does not zoom on focus. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-ink text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-negative text-xs">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-ink-muted text-xs">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** Value for aria-describedby. Points at the error when present, otherwise at the hint. */
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function Input({
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, "min-h-11 sm:min-h-10", className)}
      {...rest}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, "min-h-24 resize-y py-2", className)}
      {...rest}
    />
  );
}
