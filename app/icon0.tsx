import { ImageResponse } from "next/og";
import { VaultMark } from "@/components/vault-mark";

// 192×192 PNG for the PWA install icon (manifest). Chrome / Android
// reject SVG manifest icons, so we render to PNG via next/og.
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <VaultMark variant="rounded" />
      </div>
    ),
    { ...size },
  );
}
