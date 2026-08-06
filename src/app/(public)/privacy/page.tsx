import type { Metadata } from "next";
import LegalDocument, { Clause } from "@/components/LegalDocument";
import { LEGAL_VERSIONS, OPERATOR } from "@/lib/legal/documents";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy · getALPHA" },
  description:
    "What getALPHA collects, why, how long it is kept, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      version={LEGAL_VERSIONS.privacy}
      summary="What is collected, why, how long it is kept, who else sees it, and how to get it deleted."
    >
      <Clause heading="1. Who is responsible">
        <p>
          {OPERATOR.legalName}, registration number{" "}
          {OPERATOR.registrationNumber}, {OPERATOR.address}, is the data
          controller for the personal data described here. Contact:{" "}
          {OPERATOR.contactEmail}.
        </p>
      </Clause>

      <Clause heading="2. What is collected">
        <p>
          <strong>Account data.</strong> Your email address, and your name if you
          sign in through a provider that supplies one. This is held by our
          authentication provider, not in our own database — our records refer to
          you by an opaque account identifier.
        </p>
        <p>
          <strong>Content you enter.</strong> The trades you record: instrument,
          direction, prices, size, stop and target levels, profit or loss,
          account balance if you enter one, and any notes you write about market
          context or your own state of mind.
        </p>
        <p>
          <strong>Preferences.</strong> Your instrument watchlist and whether you
          asked for the morning email.
        </p>
        <p>
          <strong>Billing data.</strong> If you subscribe, our payment processor
          holds your payment details; we never see or store a card number. We
          store the processor&rsquo;s customer and subscription identifiers, the
          plan and its status.
        </p>
        <p>
          <strong>Consent records.</strong> The fact that you accepted these
          documents, which version, and when.
        </p>
        <p>
          <strong>Technical data.</strong> Server logs and error reports, which
          may contain an IP address and browser details. Error reports are
          configured to strip request bodies and identifying details before they
          are sent.
        </p>
        <p>
          <strong>Product analytics.</strong> Counts of two actions — that a
          trade was recorded, and that a session brief was requested — attached
          to your account identifier. These carry no prices, sizes, balances or
          notes. Analytics run on the server only; no analytics or advertising
          script runs in your browser.
        </p>
      </Clause>

      <Clause heading="3. Cookies">
        <p>
          Only strictly necessary cookies are set: those our authentication
          provider uses to keep you signed in and to protect the sign-in process.
        </p>
        <p>
          There are no advertising cookies, no third-party trackers and no
          cross-site profiling, which is why you are not asked to consent to any.
        </p>
      </Clause>

      <Clause heading="4. Why, and on what legal basis">
        <p>
          <strong>To provide the service</strong> — your account, your journal,
          your watchlist. Basis: performance of a contract with you.
        </p>
        <p>
          <strong>To take payment</strong> and manage your subscription. Basis:
          performance of a contract.
        </p>
        <p>
          <strong>To send the morning email</strong>, only if you switched it on.
          Basis: your consent, which you can withdraw at any time in Settings.
        </p>
        <p>
          <strong>To keep the service working and secure</strong> — error
          reports, logs, abuse limits. Basis: our legitimate interest in a
          service that functions and is not abused.
        </p>
        <p>
          <strong>To prove you accepted these terms.</strong> Basis: our
          legitimate interest in being able to establish and defend legal claims.
        </p>
      </Clause>

      <Clause heading="5. Who else processes it">
        <p>
          We use third-party providers for hosting, database, authentication,
          payments, email delivery, market data, error tracking, product
          analytics and the language model that generates written summaries. Each
          processes data only on our instructions.
        </p>
        <p>
          Hosting, database, analytics and email delivery are configured in the
          European Union. Some providers are established outside the EU; where
          personal data reaches them, transfers rely on the European
          Commission&rsquo;s standard contractual clauses.
        </p>
        <p>
          The content of your trades is sent to the language model provider only
          when you ask for a review of a specific trade, and only that trade and
          your own aggregated history.
        </p>
        <p>We do not sell personal data and we do not share it for advertising.</p>
      </Clause>

      <Clause heading="6. How long it is kept">
        <p>
          Account data, trades, watchlists and preferences: until you delete your
          account.
        </p>
        <p>
          Consent records and records of payments: retained after account
          deletion where we are required to keep them or need them to establish
          or defend a legal claim.
        </p>
        <p>
          Error reports and server logs: a short retention period set by the
          providers, typically weeks rather than years.
        </p>
        <p>Stored market data snapshots: replaced continuously, kept at most 24 hours.</p>
      </Clause>

      <Clause heading="7. Your rights">
        <p>
          You can ask for a copy of your data, correction of it, deletion of it,
          restriction of how it is used, or portability of it. You can object to
          processing based on legitimate interest. Where processing is based on
          consent, you can withdraw it at any time without affecting what was
          done beforehand.
        </p>
        <p>
          <strong>Deleting your account deletes your data.</strong> When you
          delete your account through your account settings, the trades,
          watchlist, preferences and subscription records held against it are
          deleted automatically, except where they must be retained under section
          6.
        </p>
        <p>
          To exercise any right, write to {OPERATOR.contactEmail}. You also have
          the right to complain to the data protection authority in your country
          of residence.
        </p>
      </Clause>

      <Clause heading="8. Changes">
        <p>
          When this policy changes materially, its version changes and you will
          be asked to review and accept it again before continuing to use the
          platform.
        </p>
      </Clause>
    </LegalDocument>
  );
}
