/**
 * The three capabilities, each with its own small visual.
 *
 * They used to be three identical blocks of prose. Three boxes that differ
 * only in their words read as one box repeated, and a reader skips all three.
 */

function Readout({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-1.5 font-mono text-xs tabular-nums last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className={tone}>{value}</span>
    </div>
  );
}

function Demo({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface p-3.5">
      {children}
    </div>
  );
}

function Feature({
  demo,
  title,
  children,
}: {
  demo: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3.5 border-t border-line pt-5">
      <Demo>{demo}</Demo>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-[15px] text-muted">{children}</p>
    </div>
  );
}

export default function Features() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-7 sm:mt-12 lg:grid-cols-3">
      <Feature
        title="A journal that computes"
        demo={
          <>
            <Readout label="Risk" value="0.94%" />
            <Readout label="Planned RR" value="2.40" />
            <Readout label="Result" value="+1.80R" tone="text-positive" />
            <Readout label="Exit" value="Target" />
          </>
        }
      >
        R-multiples, planned reward-to-risk and risk as a share of equity are
        calculated from what you record. You never type an R, so you can never
        flatter one.
      </Feature>

      <Feature
        title="The session, before it starts"
        demo={
          <svg
            viewBox="0 0 260 92"
            role="img"
            aria-label="A price line with support and resistance levels marked"
            className="block h-auto w-full"
          >
            <defs>
              <linearGradient id="landing-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b8cff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#5b8cff" stopOpacity="0" />
              </linearGradient>
            </defs>

            <line x1="0" y1="24" x2="260" y2="24" stroke="#252935" strokeDasharray="3 4" />
            <line x1="0" y1="66" x2="260" y2="66" stroke="#252935" strokeDasharray="3 4" />

            <path
              d="M0 70 L26 63 L52 68 L78 54 L104 58 L130 44 L156 49 L182 34 L208 39 L234 26 L260 30 L260 92 L0 92 Z"
              fill="url(#landing-fill)"
            />
            <path
              d="M0 70 L26 63 L52 68 L78 54 L104 58 L130 44 L156 49 L182 34 L208 39 L234 26 L260 30"
              fill="none"
              stroke="#5b8cff"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <circle cx="260" cy="30" r="3" fill="#5b8cff" />
          </svg>
        }
      >
        One short brief: the tone of the session, the single driver that
        matters, and where volatility is likely — each claim naming the calendar
        entry or headline it came from.
      </Feature>

      <Feature
        title="A review of your process"
        demo={
          <>
            <Readout
              label="Primary leak"
              value="Sizing after a loss"
              tone="text-negative"
            />
            <Readout label="Seen in" value="7 of 22 trades" />
            <Readout label="Cost" value="−4.1R" tone="text-negative" />
          </>
        }
      >
        Six dimensions, judged against your own history rather than a generic
        ideal. &ldquo;Twice your median risk&rdquo; is a finding. &ldquo;Risk
        should be 1%&rdquo; is a platitude.
      </Feature>
    </div>
  );
}
