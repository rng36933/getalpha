# Going live

Everything here is done in someone else's dashboard, not in this repository.
The code is already written for all of it; what is missing is configuration.

After changing anything in Vercel's environment variables, redeploy **without
build cache** — `NEXT_PUBLIC_*` values are inlined at build time, so an
unchanged bundle keeps the old ones.

---

## 1. Stripe — live mode

The sandbox account "getALPHA sandbox" is what runs today. Live mode is a
separate set of objects: the sandbox product, prices, tax settings and webhook
do **not** carry over.

1. **Switch the dashboard out of test mode** (top-right toggle).
2. **Product** — Product catalogue → *Add product*.
   - Name: `getALPHA Pro`
   - Two recurring prices: **€19.99 / month** and **€99.99 / year**.
3. **Tax code** — on that product, *Edit product* → **Tax code** →
   `txcd_10103000` (Software as a service (SaaS) — business use).
   This is the step that has to be done again in live mode. Without it, and
   with Stripe Tax switched on, Stripe refuses to create the checkout session
   and the app can only report **"Could not start checkout"** — the real reason
   never reaches the browser. If it fails, read the actual error in Stripe →
   *Developers* → *Logs*.
4. **Webhook** — Developers → Webhooks → *Add endpoint*:
   - URL: `https://www.getalpha.org/api/billing/webhook`
   - Events — the six the handler acts on: `checkout.session.completed`,
     `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `customer.subscription.paused`,
     `customer.subscription.resumed`.
   - Copy the signing secret (`whsec_…`).
5. **Vercel env** (Production scope), then redeploy without cache:

   | Variable | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | the live `sk_live_…` key |
   | `STRIPE_WEBHOOK_SECRET` | the `whsec_…` from step 4 |
   | `STRIPE_PRICE_PRO_MONTHLY` | the live monthly `price_…` id |
   | `STRIPE_PRICE_PRO_YEARLY` | the live yearly `price_…` id |

   None of these are `NEXT_PUBLIC_`, so marking them **Sensitive** is fine.

6. **Check it with a real card.** Live mode has no test cards. Subscribe, see
   the plan turn Pro, then cancel and refund yourself.

> **VAT is not handled in code.** `/api/billing/checkout` does not send
> `automatic_tax`, so nothing here calculates or collects VAT on a €19.99
> subscription sold to consumers in the EU. Selling cross-border to consumers
> normally means OSS registration. That is an accountant's question, not a
> code change to make blind — but it has to be answered before taking money
> from strangers.

---

## 2. Clerk — Production instance

The site currently runs on the **development** instance
`generous-marlin-85.clerk.accounts.dev`, which is why the keys are `pk_test_`
and `sk_test_`. Dev instances are rate-limited, show a development banner, and
their sessions are not meant for real users.

1. Clerk dashboard → the application → **Create production instance**
   (it offers to clone the dev instance's settings — take that).
2. Clerk shows a list of **DNS records** to add for `getalpha.org`
   (`clerk`, `accounts`, `clkmail`, plus two `clk._domainkey` CNAMEs).
   Add them where the domain's DNS lives, then press *Verify* in Clerk.
   Propagation is usually minutes, occasionally hours.
3. **OAuth credentials.** Production Google/GitHub sign-in needs your own
   OAuth app; Clerk's shared dev credentials do not work in production.
   Skip only if email-and-password is the only method offered.
4. **Vercel env** → replace with the production keys, then redeploy without
   cache:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` — must **not** be marked Sensitive |
   | `CLERK_SECRET_KEY` | `sk_live_…` |

   A wrong or withheld `CLERK_SECRET_KEY` produces a failure that only appears
   on the handshake leg: the first anonymous request redirects to Clerk and the
   return to `/?__clerk_handshake=…` answers 500. Reproduce it with a browser
   user-agent — plain `curl` shows a harmless 404 and hides the problem:

   ```bash
   curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o /dev/null -w "%{http_code}\n" https://www.getalpha.org/
   ```

5. **Existing accounts do not migrate.** A production instance starts with an
   empty user list, and the Clerk user ids change. Anything keyed by `userId`
   in the database — trades, watchlists, settings — belongs to the old ids.
   Do this before there are real users, or plan the remapping.

---

## 3. Environment variables still unset

Each of these silently disables a feature that is otherwise finished.

| Variable | What stays off without it |
|---|---|
| `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` | The morning brief email. The cron route refuses unauthenticated calls, so all three are needed together. |
| `SUPPORT_ADMIN_USER_IDS` | **Nobody can read support tickets, including you.** Set it to your own Clerk user id (comma-separated for several). |
| `CLERK_WEBHOOK_SECRET` | Deleting a Clerk account leaves that person's rows in the database — a GDPR obligation, not a nicety. Needs a Clerk webhook pointed at `/api/webhooks/clerk` for `user.deleted`. |
| `NEXT_PUBLIC_SENTRY_DSN` | Errors in production are invisible. Not Sensitive — it is a `NEXT_PUBLIC_` value. |
| `TURNSTILE_SECRET_KEY` | Optional bot check on the public forms. |
| `PRO_USER_IDS` | Nobody gets the paid modules for free. See section 4. |

---

## 4. Giving somebody Pro without charging them

Set `PRO_USER_IDS` in Vercel to a comma-separated list of **Clerk user ids**.
Everyone on it gets the AI Session Brief and the AI Coach, with no subscription,
no Stripe object, and nothing to cancel. Removing an id revokes it on the next
deploy.

1. **They sign up themselves** at https://www.getalpha.org/register. Nobody can
   create the account for them, and until it exists there is no id to grant
   against.
2. **Find their id:** Clerk dashboard → *Users* → click the person → copy the
   `user_…` id from their profile.
3. **Vercel** → Settings → Environment Variables → `PRO_USER_IDS`. Several ids
   are comma-separated: `user_abc,user_def`. Server-only, so marking it
   Sensitive is fine.
4. **Redeploy.** Environment changes only take effect on a new deployment.

They can confirm it worked on the Plans page, which says the modules are already
unlocked, and by opening a Coach review on any trade.

Ids rather than email addresses on purpose: whoever owns an account can change
its email, and an entitlement that follows a mutable field is an entitlement
anyone can move.

> **The AI budget is shared, and it is not per-person.**
> `AI_DAILY_BUDGET_USD` defaults to **$2 a day for the whole application**, and
> a Coach review costs about $0.09–0.11. That is roughly 18–20 reviews a day
> across every account together, so a comped friend runs the same pot down as
> you do, and whoever asks nineteenth gets an HTTP 402. Raise the variable if
> two people are going to use it seriously — it is the only thing standing
> between an enthusiastic friend and your Anthropic bill.

---

## 5. Legal documents

`src/lib/legal/documents.ts` still carries visible square-bracket markers for
every operator detail — `[COMPANY LEGAL NAME]`,
`[COMPANY REGISTRATION NUMBER]`, `[REGISTERED ADDRESS]`, `[CONTACT EMAIL]`,
`[COUNTRY OF REGISTRATION]`. They are deliberately visible so the pages cannot
be mistaken for finished.

The text was drafted by an AI. For a paid financial-adjacent product sold in
the EU, that is a draft for a lawyer to correct, not compliance. Fill in the
operator details and have the terms, privacy policy and disclaimer reviewed
before charging anyone.
