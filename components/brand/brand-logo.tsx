import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/ui/cn";
import { BRAND_PRIMITIVES as prism } from "@/lib/theme/foundation";

export function BrandMark({
  fill,
  ...props
}: Pick<SVGProps<SVGSVGElement>, "className" | "width" | "height" | "fill">) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width={48} height={48} fill="none" {...props}>
      <path
        d="M24 4C37 4 44 14 38 25C34 32 27 34 20 30C11 25 13 15 24 4Z"
        fill={fill ?? prism.aqua}
      />
      <path
        d="M42 31C36 43 24 46 17 36C12 30 14 21 21 17C30 12 38 19 42 31Z"
        fill={fill ?? prism.violet}
        fillOpacity=".9"
      />
      <path
        d="M12 40C0 32 2 19 13 17C21 15 28 21 28 29C28 39 20 43 12 40Z"
        fill={fill ?? prism.blue}
        fillOpacity=".86"
      />
      <path d="M24 15 32 24 24 33 16 24Z" fill={fill ?? prism.reading} fillOpacity=".94" />
      <path
        d="M24 6C34 6 40 12 38 19M40 31C35 40 27 42 22 38M12 38C4 32 5 23 12 20"
        stroke={fill ?? prism.white}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity=".92"
      />
      <path
        d="m24 15 8 9-8 9-8-9Z"
        stroke={fill ?? prism.focus}
        strokeWidth=".6"
        strokeOpacity=".3"
      />
    </svg>
  );
}

export function BrandLogo({
  children = "Fyura Productivity",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <BrandMark className="brand-mark size-10 shrink-0" />
      <span className="sr-only">{children}</span>
    </span>
  );
}
