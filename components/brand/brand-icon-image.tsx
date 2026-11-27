import { ImageResponse } from "next/og";
import { BrandMark } from "./brand-logo";
import { BRAND_PRIMITIVES } from "@/lib/theme/foundation";

export function brandIconImage(size: { width: number; height: number }, borderRadius: number) {
  const markSize = Math.round(size.width * 0.75);

  // Metadata images render without the document's theme styles.
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BRAND_PRIMITIVES.canvas,
        borderRadius,
      }}
    >
      <BrandMark width={markSize} height={markSize} />
    </div>,
    size,
  );
}
