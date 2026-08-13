import { ImageResponse } from "next/og";

/**
 * A 192x192 companion to the root `icon.tsx` (which only emits 512x512) —
 * Android's install prompt and app drawer want a smaller size too, and the
 * PWA manifest needs a stable, non-hashed URL to point at.
 */
export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f2c94c",
          borderRadius: "42px",
          fontFamily: "sans-serif",
          color: "#0a0b0f",
          fontSize: "120px",
          fontWeight: 700,
        }}
      >
        α
      </div>
    ),
    { width: 192, height: 192 },
  );
}
