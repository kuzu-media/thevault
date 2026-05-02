import { ImageResponse } from "next/og";
import { VaultMark } from "@/components/vault-mark";

// 512×512 PNG for the PWA install icon (manifest). Same design as
// icon0 at higher resolution.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon512() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <VaultMark variant="rounded" />
      </div>
    ),
    { ...size },
  );
}
