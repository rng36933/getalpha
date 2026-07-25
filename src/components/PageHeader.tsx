type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      ) : null}
    </header>
  );
}
