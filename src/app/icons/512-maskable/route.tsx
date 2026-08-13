import { ImageResponse } from "next/og";

/**
 * Maskable variant for Android's adaptive icons — the OS crops this to a
 * circle, squircle, or other shape depending on the launcher, so unlike
 * `icon.tsx` this is full-bleed (no rounded corners baked in) with the glyph
 * shrunk to sit inside the ~80% "safe zone" every mask respects.
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
          fontFamily: "sans-serif",
          color: "#0a0b0f",
          fontSize: "210px",
          fontWeight: 700,
        }}
      >
        α
      </div>
    ),
    { width: 512, height: 512 },
  );
}
