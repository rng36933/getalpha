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
    <article>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-xs text-muted">Version {version}</p>
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
      <h2 className="text-sm font-medium">{heading}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}
