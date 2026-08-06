import type { Metadata } from "next";
import LegalDocument, { Clause } from "@/components/LegalDocument";
import { LEGAL_VERSIONS, OPERATOR } from "@/lib/legal/documents";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service · getALPHA" },
  description: "The agreement between you and getALPHA.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      version={LEGAL_VERSIONS.terms}
      summary="The agreement between you and the operator of getALPHA. By creating an account you accept these terms, the Privacy Policy and the Risk Disclaimer."
    >
      <Clause heading="1. Who you are contracting with">
        <p>
          getALPHA is operated by {OPERATOR.legalName}, registration number{" "}
          {OPERATOR.registrationNumber}, {OPERATOR.address} (&ldquo;we&rdquo;).
        </p>
        <p>
          These terms apply together with the{" "}
          <a href="/privacy" className="text-accent">Privacy Policy</a> and the{" "}
          <a href="/disclaimer" className="text-accent">Risk Disclaimer</a>. The
          Risk Disclaimer governs in the event of any conflict about the nature
          of the service.
        </p>
      </Clause>

      <Clause heading="2. What the service is">
        <p>
          A trading journal, market data displays, and written summaries produced
          partly by an automated language model. It is an educational and
          informational tool. It is not a regulated investment service, and we
          are not an investment firm, adviser or broker. See the Risk Disclaimer.
        </p>
      </Clause>

      <Clause heading="3. Eligibility">
        <p>
          You must be at least 18 and legally able to enter into a contract. You
          must not use the service where doing so would breach the law that
          applies to you.
        </p>
      </Clause>

      <Clause heading="4. Your account">
        <p>
          Keep your credentials secure and do not let anyone else use your
          account. Tell us promptly at {OPERATOR.contactEmail} if you believe it
          has been accessed without your permission. You are responsible for
          activity under your account.
        </p>
        <p>One person, one account. Accounts are not transferable.</p>
      </Clause>

      <Clause heading="5. Acceptable use">
        <p>You agree not to:</p>
        <p>
          — access the service by any automated means, or at a rate that
          interferes with it for others;
          <br />— attempt to circumvent authentication, rate limits, usage limits
          or payment;
          <br />— resell, redistribute or publish the output of the service as
          your own product or as a signal service;
          <br />— submit content designed to manipulate the automated components
          into behaving outside their intended purpose;
          <br />— upload unlawful content, or anyone&rsquo;s personal data other
          than your own;
          <br />— reverse engineer, scrape or copy the service other than as
          permitted by law.
        </p>
      </Clause>

      <Clause heading="6. Subscriptions, payment and cancellation">
        <p>
          Some features require a paid plan. Prices are shown on the plans page
          before purchase and are charged in advance for each billing period by
          our payment processor. Prices include applicable VAT where our
          processor is responsible for collecting it.
        </p>
        <p>
          A subscription renews automatically at the end of each period until you
          cancel. You may cancel at any time; cancellation takes effect at the
          end of the period you have already paid for, and you keep access until
          then.
        </p>
        <p>
          <strong>Right of withdrawal.</strong> If you are a consumer in the
          European Union you normally have 14 days to withdraw from a distance
          contract. By subscribing and gaining immediate access to the paid
          features you ask us to begin performance during that period and
          acknowledge that you lose the right of withdrawal once the service has
          been fully performed. Nothing here removes any right you have that
          cannot be waived.
        </p>
        <p>
          We may change prices for future billing periods. We will tell you
          before a change takes effect, and you may cancel if you do not accept
          it.
        </p>
      </Clause>

      <Clause heading="7. Your content">
        <p>
          Your trades, notes and settings remain yours. You grant us only the
          permission needed to operate the service for you: to store that
          content, display it back to you, and process it to produce the reviews
          you ask for.
        </p>
        <p>We do not use your content to train models.</p>
      </Clause>

      <Clause heading="8. Our content">
        <p>
          The platform, its interface, its text and the software behind it are
          our intellectual property or that of our licensors. You are granted a
          personal, non-exclusive, non-transferable, revocable licence to use the
          service while your account is active.
        </p>
        <p>
          Written summaries produced for you may be used for your own trading and
          learning. They may not be republished, resold, or distributed as a
          signal or advisory product.
        </p>
        <p>
          Third-party market data remains the property of its providers and is
          licensed to you only for personal use within the service.
        </p>
      </Clause>

      <Clause heading="9. Availability">
        <p>
          We aim to keep the service available but do not guarantee uninterrupted
          access. It depends on third-party providers, and features may be
          delayed, degraded or unavailable. We may change or discontinue features
          and will give reasonable notice of a material reduction to a paid
          feature.
        </p>
      </Clause>

      <Clause heading="10. Suspension and termination">
        <p>
          You may stop using the service and delete your account at any time from
          your account settings.
        </p>
        <p>
          We may suspend or terminate an account that breaches these terms, that
          we reasonably believe is being used unlawfully or fraudulently, or
          where payment has failed and remains unpaid. Where it is reasonable to
          do so, we will warn you first and give you an opportunity to put it
          right. Where a suspension is not your fault, we will refund the unused
          part of any period already paid for.
        </p>
        <p>
          On termination your licence ends and your data is handled as described
          in the Privacy Policy.
        </p>
      </Clause>

      <Clause heading="11. Liability">
        <p>
          The service is provided as is. To the fullest extent permitted by law
          we exclude implied warranties, and we are not liable for trading
          losses, lost profits, lost opportunity or indirect or consequential
          loss.
        </p>
        <p>
          Where we are liable, our total liability in any twelve-month period is
          limited to the amount you paid us in that period.
        </p>
        <p>
          Nothing here limits liability for death or personal injury caused by
          negligence, for fraud, or for anything else that cannot be limited by
          law. If you are a consumer, your statutory rights are unaffected.
        </p>
      </Clause>

      <Clause heading="12. Changes to these terms">
        <p>
          We may update these terms. When we do, the version changes and you are
          asked to accept the new version before continuing to use the service.
          If you do not accept it you may stop using the service and delete your
          account.
        </p>
      </Clause>

      <Clause heading="13. Governing law and disputes">
        <p>
          These terms are governed by the law of {OPERATOR.jurisdiction}, and the
          courts of {OPERATOR.jurisdiction} have jurisdiction.
        </p>
        <p>
          If you are a consumer resident in the European Union, this does not
          deprive you of the protection of the mandatory law of your own country,
          and you may bring proceedings in the courts there.
        </p>
        <p>
          Please contact us first at {OPERATOR.contactEmail} — most disputes are
          resolved that way. EU consumers may also use the European
          Commission&rsquo;s online dispute resolution platform.
        </p>
      </Clause>
    </LegalDocument>
  );
}
