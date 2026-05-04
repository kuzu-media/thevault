import { ImageResponse } from "next/og";
import { VaultMark } from "@/components/vault-mark";

// Apple home-screen / Mac-dock icon. iOS Safari ignores SVG, so render
// a 180×180 PNG. Apple applies its own rounded-corner mask, so use the
// "edge" variant — no rounded background, dial bleeds to the edges.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f3eee5",
          display: "flex",
        }}
      >
        <VaultMark variant="edge" />
      </div>
    ),
    { ...size },
  );
}
