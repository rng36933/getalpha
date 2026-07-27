import type { Locale } from "../locales.ts";

/**
 * Every word on the Plans page: `PricingPage` itself and `PricingPlans.tsx`.
 *
 * Plan names, taglines and feature lists live in `lib/billing/plans.ts` as
 * plain English strings — that file has no notion of locale, so the
 * translations live here instead, keyed by the same `PlanSlug`s, and the page
 * substitutes them in when it builds each `PlanCard`.
 */
export type PricingCopy = {
  title: string;
  subtitle: string;
  complimentaryNotice: string;
  checkoutSuccessNotice: string;
  checkoutCancelledNotice: string;
  sellingClosedNotice: string;
  testModeNotice: string;
  free: {
    name: string;
    tagline: string;
    features: readonly string[];
  };
  pro: {
    name: string;
    features: readonly string[];
    monthlyTagline: string;
    yearlyTagline: string;
    bestValue: string;
  };
  perInterval: (interval: string) => string;
  currentPlan: string;
  notForSaleYet: string;
  notAvailableYet: string;
  openingCheckout: string;
  subscribe: string;
  checkoutFailed: string;
  networkError: string;
};

const en: PricingCopy = {
  title: "Plans",
  subtitle:
    "The AI Session Brief and AI Coach are the paid modules. Everything else is free.",
  complimentaryNotice:
    "The AI Session Brief and AI Coach are already unlocked on this account. There is nothing to pay and nothing to subscribe to — ignore the plans below.",
  checkoutSuccessNotice:
    "Payment received. Access is granted as soon as Stripe confirms it — usually a second or two. Reload if the AI modules are still locked.",
  checkoutCancelledNotice: "Checkout was cancelled. Nothing was charged.",
  sellingClosedNotice:
    "Payments are not open yet. Pro is not for sale on this site until billing goes live — nothing here can be bought, and nothing will be charged.",
  testModeNotice:
    "Stripe is in test mode. Use card 4242 4242 4242 4242 with any future expiry and any CVC — no real money moves.",
  free: {
    name: "Free",
    tagline: "Everything except the AI modules.",
    features: [
      "Trade journal with computed P&L, risk and planned reward-to-risk",
      "Live price charts for your watchlist",
      "Economic calendar",
    ],
  },
  pro: {
    name: "Pro",
    features: [
      "AI Session Brief before every session",
      "AI Coach process review on any trade",
      "Everything in Free",
    ],
    monthlyTagline: "Billed monthly, cancel any time.",
    yearlyTagline: "Billed once a year.",
    bestValue: "Best value",
  },
  perInterval: (interval) => `/ ${interval}`,
  currentPlan: "Current plan",
  notForSaleYet: "Not for sale yet",
  notAvailableYet: "Not available yet",
  openingCheckout: "Opening checkout…",
  subscribe: "Subscribe",
  checkoutFailed: "Could not start checkout. Try again.",
  networkError: "Could not reach the server. Check your connection.",
};

const lt: PricingCopy = {
  title: "Planai",
  subtitle:
    "AI seanso apžvalga ir AI treneris yra mokami moduliai. Viskas kita — nemokama.",
  complimentaryNotice:
    "AI seanso apžvalga ir AI treneris šioje paskyroje jau atrakinti. Mokėti ir prenumeruoti nereikia nieko — likusius planus žemiau ignoruok.",
  checkoutSuccessNotice:
    "Mokėjimas gautas. Prieiga suteikiama vos tik Stripe jį patvirtina — paprastai per sekundę kitą. Jei AI moduliai vis dar užrakinti, perkrauk puslapį.",
  checkoutCancelledNotice: "Apmokėjimas atšauktas. Nieko nenuskaičiuota.",
  sellingClosedNotice:
    "Mokėjimai dar neatidaryti. Pro planas šioje svetainėje neparduodamas, kol neįjungti atsiskaitymai — čia nieko negalima nusipirkti, ir niekas nebus nuskaičiuota.",
  testModeNotice:
    "Stripe veikia testiniu režimu. Naudok kortelę 4242 4242 4242 4242 su bet kokia ateities galiojimo data ir bet kokiu CVC — tikri pinigai nejuda.",
  free: {
    name: "Nemokamas",
    tagline: "Viskas, išskyrus AI modulius.",
    features: [
      "Sandorių žurnalas su apskaičiuotu P&L, rizika ir planuojamu pelno/rizikos santykiu",
      "Gyvi kainų grafikai tavo stebimiesiems",
      "Ekonominis kalendorius",
    ],
  },
  pro: {
    name: "Pro",
    features: [
      "AI seanso apžvalga prieš kiekvieną seansą",
      "AI trenerio proceso apžvalga bet kuriam sandoriui",
      "Viskas, kas yra Nemokamame plane",
    ],
    monthlyTagline: "Atsiskaitoma kas mėnesį, atšaukti galima bet kada.",
    yearlyTagline: "Atsiskaitoma kartą per metus.",
    bestValue: "Geriausia vertė",
  },
  perInterval: (interval) =>
    `/ ${interval === "month" ? "mėn." : interval === "year" ? "metus" : interval}`,
  currentPlan: "Dabartinis planas",
  notForSaleYet: "Dar neparduodama",
  notAvailableYet: "Dar nepasiekiama",
  openingCheckout: "Atidaroma atsiskaitymo forma…",
  subscribe: "Prenumeruoti",
  checkoutFailed: "Nepavyko pradėti atsiskaitymo. Bandyk dar kartą.",
  networkError: "Nepavyko pasiekti serverio. Patikrink ryšį.",
};

const PRICING: Record<Locale, PricingCopy> = { en, lt };

export function pricingCopy(locale: Locale): PricingCopy {
  return PRICING[locale];
}
