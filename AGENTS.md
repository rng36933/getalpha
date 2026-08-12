<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Standing permission: daily blog publishing

Almintas (repo owner) authorized on 2026-08-06: Claude may write a new blog
post from the backlog below and push it straight to `main` (Vercel auto-deploys
on push) **without asking for per-post confirmation**. This is a durable,
pre-approved exception to the usual "ask before publishing/pushing" rule —
it applies to blog posts specifically, not to other pushes or public content.

Each run:
1. Pick the next unwritten topic from the backlog list below, top to bottom.
2. Write the post as a real page under `src/app/(public)/blog/<slug>/`,
   following the pattern of the existing posts (`why-win-rate-doesnt-matter`,
   `mt5-trading-journal-guide`) and `src/components/BlogPost.tsx`.
3. Add its metadata entry to `src/lib/blog.ts` (`BLOG_POSTS`), newest first,
   with today's date.
4. Run `npm run lint` **and** `npm run build` before committing — `build`
   alone does not catch ESLint errors like unescaped JSX entities
   (`react/no-unescaped-entities`), and a lint failure fails CI even though
   the build succeeds. Fix anything the new post's files trigger.
5. Commit and push to `main`.
6. Cross out the topic below (strike it or move it to "Published") so the
   next run doesn't repeat it.

**Blog backlog** (remaining, in order):
- [ ] "5 things a trading journal should show you"

**Published:**
- [x] How to Build a Trading Journal for MetaTrader 5 (2026-08-06)
- [x] Why Your Win Rate Doesn't Matter (2026-08-07)
- [x] R-Multiple vs P&L (2026-08-06)
- [x] Automatic MT5 journaling (2026-08-09)
- [x] What Is an AI Trading Coach (2026-08-10)
- [x] Trading discipline / habit (2026-08-11)
- [x] Economic calendar without overtrading (2026-08-12)

Once the backlog above is empty, **stop and ask Almintas for more topics**
rather than inventing new ones — this standing permission covers working
through this list, not open-ended autonomous content creation.
