/**
 * A faint film-grain texture over the whole app, so a flat dark background
 * reads as a surface rather than a perfectly smooth digital void.
 *
 * A small repeating background-image tile rather than a live SVG filter: a
 * `feTurbulence` filter sized to the viewport gets rasterised by the browser
 * on every paint, where a decoded tile repeats for free. Fixed and z-50 so
 * it sits above every card and chart on the page, mix-blend-screen so it
 * only ever lightens (an "overlay" blend darkens dark pixels further,
 * which made it invisible against this app's near-black background).
 */
export default function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 opacity-10 mix-blend-screen"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
      }}
    />
  );
}
