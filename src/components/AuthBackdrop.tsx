import AmbientCandles from "@/components/landing/AmbientCandles";

/**
 * The backdrop behind the sign-in and sign-up screens.
 *
 * These pages were a card on flat black with two thirds of the phone empty
 * above it — which reads as an unfinished page rather than a calm one, and it
 * is the screen where somebody decides whether this product is real.
 *
 * Deliberately the *same* backdrop as the landing page rather than something
 * new: candles and drifting motes, reusing the components that page already
 * defines — flat and free of grid lines or glow, matching the landing page's
 * own de-slopped background. A visitor arrives here by pressing a button on
 * the landing page, and meeting a different visual language at that exact
 * moment is the seam this project has worried about before. Continuity is
 * the whole point; inventing a second decorative style for one screen would
 * undo it.
 *
 * Quieter than the hero, though, and that is not laziness. The hero's job is to
 * be looked at. This screen's job is a form with two fields in it, so the
 * candles are dimmed, there are four motes instead of six, and the glow sits
 * further back. Decoration that competes with a password field is a cost, not
 * a feature.
 */

/** Fixed positions, so the composition is the same on every load. */
const MOTES = [
  { left: "12%", top: "22%", size: "size-1", dur: "15s", delay: "0s" },
  { left: "34%", top: "68%", size: "size-1.5", dur: "19s", delay: "2.1s" },
  { left: "71%", top: "18%", size: "size-1", dur: "17s", delay: "3.4s" },
  { left: "88%", top: "58%", size: "size-1", dur: "21s", delay: "1.2s" },
];

export default function AuthBackdrop() {
  return (
    /*
     * `overflow-hidden` is load-bearing. The glow below is wider than the
     * viewport and centred, and without this the whole page gains a horizontal
     * scroll on a 375px phone — a bug this codebase has already shipped once,
     * caused by an ornament nobody can even see move.
     */
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Dimmed to a little over half what the hero shows. Enough to read as
          the same product, not enough to sit behind the type. */}
      <div className="absolute inset-0 opacity-60">
        <AmbientCandles />
      </div>

      {MOTES.map((mote) => (
        <span
          key={`${mote.left}-${mote.top}`}
          className={`lp-drift absolute ${mote.size} rounded-full bg-white/70 blur-[1px]`}
          style={
            {
              left: mote.left,
              top: mote.top,
              "--dur": mote.dur,
              "--delay": mote.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
