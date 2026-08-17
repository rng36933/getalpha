type LegalDocumentProps = {
  title: string;
  version: string;
  /** One line saying what this document is for, before the clauses start. */
  summary: string;
  children: React.ReactNode;
};

/** Shared chrome for the legal pages, so all three read as one set. */
export default function LegalDocument({
  title,
  version,
  summary,
  children,
}: LegalDocumentProps) {
  return (
    <article className="pb-16 md:pb-20">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 inline-block rounded-none border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-[#f2c94c]">
        Version {version}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">{summary}</p>

      <div className="mt-8 space-y-8">{children}</div>
    </article>
  );
}

export function Clause({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white md:text-base">
        {heading}
      </h2>
      {/* Every emphasised sentence across Terms, Privacy and Disclaimer reads
          gold from this one place, rather than each clause colouring its own
          <strong> — the parts worth stopping to read (who bears the risk,
          what this platform is not) should look the same wherever they
          appear. */}
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted [&_strong]:font-semibold [&_strong]:text-accent">
        {children}
      </div>
    </section>
  );
}
