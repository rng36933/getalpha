import { ImageResponse } from "next/og";

/**
 * The site's favicon and app icon, generated rather than a checked-in binary
 * — same reasoning as `opengraph-image.tsx`: it can't drift from the
 * wordmark's actual colour, because it's built from the same two hex values.
 *
 * Next's `icon` file convention picks this up automatically as the browser
 * tab icon and the PWA/home-screen icon. There was no favicon at all before
 * this — the browser default.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";
export const runtime = "edge";

export default async function Icon() {
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
          borderRadius: "112px",
          fontFamily: "sans-serif",
          color: "#0a0b0f",
          fontSize: "320px",
          fontWeight: 700,
        }}
      >
        α
      </div>
    ),
    size,
  );
}
