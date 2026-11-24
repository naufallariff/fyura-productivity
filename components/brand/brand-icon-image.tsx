import { ImageResponse } from "next/og";
import { BrandMark } from "./brand-logo";

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
        backgroundColor: "rgb(22, 86, 119)",
        borderRadius,
      }}
    >
      <BrandMark width={markSize} height={markSize} fill="white" />
    </div>,
    size,
  );
}
