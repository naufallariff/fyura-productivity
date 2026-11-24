import { brandIconImage } from "@/components/brand/brand-icon-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return brandIconImage(size, 0);
}
