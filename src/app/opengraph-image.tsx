import { ImageResponse } from "next/og";

/**
 * The link preview card, drawn at request time.
 *
 * Generated rather than a checked-in PNG: it stays in step with the wordmark
 * and the palette, and there is no binary in the repository that quietly stops
 * matching the site. Rendered once and then cached by the crawlers that fetch
 * it, so the cost is not per visitor.
 */
export const alt =
  "getALPHA — a trading desk that judges your process, not your luck";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0b0f",
          padding: "72px",
          // The OG renderer has no access to the app's webfonts, so this asks
          // for whatever the runtime has rather than silently falling back to
          // a serif face that looks nothing like the site.
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#5b8cff",
              color: "#0a0b0f",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            α
          </div>
          <div style={{ display: "flex", fontSize: "32px", fontWeight: 600 }}>
            <span style={{ color: "#e9ebf0" }}>get</span>
            <span style={{ color: "#5b8cff" }}>ALPHA</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 600,
              lineHeight: 1.15,
              color: "#e9ebf0",
              letterSpacing: "-0.02em",
            }}
          >
            A trading desk that judges
          </div>
          <div
            style={{
              display: "flex",
              gap: "16px",
              fontSize: "64px",
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ color: "#5b8cff" }}>your process,</span>
            <span style={{ color: "#e9ebf0" }}>not your luck.</span>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: "26px", color: "#8a90a0" }}>
          Journal · Session brief · Process review
        </div>
      </div>
    ),
    size,
  );
}
