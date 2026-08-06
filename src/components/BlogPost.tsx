import Link from "next/link";

type BlogPostProps = {
  title: string;
  date: string;
  children: React.ReactNode;
};

function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** Shared chrome for a blog post, so every article reads as one set. */
export default function BlogPost({ title, date, children }: BlogPostProps) {
  return (
    <article>
      <Link href="/blog" className="text-xs text-muted hover:text-accent">
        ← Blog
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      <p className="mt-1 text-xs text-muted">{dateLabel(date)}</p>

      <div className="prose-blog mt-8 space-y-5 text-sm leading-relaxed text-muted [&_a]:text-accent [&_a]:underline-offset-2 [&_a:hover]:underline [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-accent">
        {children}
      </div>
    </article>
  );
}
