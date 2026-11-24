import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/ui/cn";

export function BrandMark({
  fill = "currentColor",
  ...props
}: Pick<SVGProps<SVGSVGElement>, "className" | "width" | "height" | "fill">) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={24} height={24} fill={fill} {...props}>
      <path d="M6 2H22L18 6H10V10H18L14 14H10V22H6Z" />
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
      <BrandMark className="bg-accent text-on-accent size-9 shrink-0 rounded-lg p-1.5" />
      <span className="truncate">{children}</span>
    </span>
  );
}
