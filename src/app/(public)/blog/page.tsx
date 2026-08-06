import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: { absolute: "Blog · getALPHA" },
  description: "Notes on trading journals, process review, and MetaTrader — from the people building getALPHA.",
  alternates: { canonical: "/blog" },
};

function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function BlogIndexPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-2 text-sm text-muted">
        Notes on trading journals, process review, and MetaTrader.
      </p>

      <ol className="mt-8 space-y-8">
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="border-b border-line pb-8 last:border-0">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">
              {dateLabel(post.date)}
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                {post.title}
              </Link>
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              {post.description}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
