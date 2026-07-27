import type { Locale } from "../locales.ts";

/**
 * Every word on the Support page: `SupportPage`, `SupportForm.tsx`, and
 * `SupportInbox.tsx` (the admin-only ticket list).
 *
 * `ticket.message` and `ticket.pageUrl` are whatever the sender typed or the
 * URL they were on — data, not UI copy, never translated.
 */
export type SupportCopy = {
  title: string;
  subtitle: string;
  sendMessageCardTitle: string;
  inboxCardTitle: string;
  inboxCardTitleWithCount: (open: number) => string;
  inboxLoadFailed: string;
  form: {
    legend: string;
    kinds: { bug: string; feedback: string; question: string };
    messageLabel: string;
    placeholderBug: string;
    placeholderOther: string;
    pageAttachedNote: string;
    sendFailed: string;
    networkError: string;
    sentNotice: string;
    sendAnother: string;
    sending: string;
    send: string;
  };
  inbox: {
    nothingHere: string;
    kinds: { bug: string; feedback: string; question: string };
    closed: string;
    updateFailed: string;
    networkError: string;
    saving: string;
    markDone: string;
    reopen: string;
  };
};

const en: SupportCopy = {
  title: "Support",
  subtitle: "Report something broken, or tell us what would make this better.",
  sendMessageCardTitle: "Send a message",
  inboxCardTitle: "Inbox",
  inboxCardTitleWithCount: (open) => `Inbox · ${open} open`,
  inboxLoadFailed: "The inbox could not be loaded. Reload in a moment.",
  form: {
    legend: "What kind of message is this?",
    kinds: {
      bug: "Something is broken",
      feedback: "Feedback or an idea",
      question: "A question",
    },
    messageLabel: "Your message",
    placeholderBug:
      "What did you do, what did you expect, and what happened instead?",
    placeholderOther: "Tell us what you are thinking.",
    pageAttachedNote: "The page you are on is attached automatically.",
    sendFailed: "Could not send that. Try again.",
    networkError: "Could not reach the server. Check your connection.",
    sentNotice: "Sent. Thank you — this gets read.",
    sendAnother: "Send something else",
    sending: "Sending…",
    send: "Send",
  },
  inbox: {
    nothingHere: "Nothing here.",
    kinds: { bug: "Bug", feedback: "Feedback", question: "Question" },
    closed: "closed",
    updateFailed: "Could not update that ticket.",
    networkError: "Could not reach the server.",
    saving: "Saving…",
    markDone: "Mark done",
    reopen: "Reopen",
  },
};

const lt: SupportCopy = {
  title: "Pagalba",
  subtitle: "Praneik, kas sugedo, arba pasakyk, kas tai padarytų geriau.",
  sendMessageCardTitle: "Siųsti žinutę",
  inboxCardTitle: "Gautieji",
  inboxCardTitleWithCount: (open) => `Gautieji · ${open} atviri`,
  inboxLoadFailed: "Nepavyko įkelti gautųjų. Perkrauk po akimirkos.",
  form: {
    legend: "Kokio tipo ši žinutė?",
    kinds: {
      bug: "Kažkas sugedo",
      feedback: "Atsiliepimas ar idėja",
      question: "Klausimas",
    },
    messageLabel: "Tavo žinutė",
    placeholderBug: "Ką darei, ko tikėjaisi, ir kas įvyko vietoj to?",
    placeholderOther: "Pasakyk, apie ką galvoji.",
    pageAttachedNote: "Puslapis, kuriame esi, pridedamas automatiškai.",
    sendFailed: "Nepavyko to išsiųsti. Bandyk dar kartą.",
    networkError: "Nepavyko pasiekti serverio. Patikrink ryšį.",
    sentNotice: "Išsiųsta. Ačiū — tai perskaitoma.",
    sendAnother: "Siųsti dar ką nors",
    sending: "Siunčiama…",
    send: "Siųsti",
  },
  inbox: {
    nothingHere: "Čia nieko nėra.",
    kinds: { bug: "Klaida", feedback: "Atsiliepimas", question: "Klausimas" },
    closed: "uždaryta",
    updateFailed: "Nepavyko atnaujinti šio bilieto.",
    networkError: "Nepavyko pasiekti serverio.",
    saving: "Saugoma…",
    markDone: "Pažymėti kaip atlikta",
    reopen: "Atidaryti iš naujo",
  },
};

const SUPPORT: Record<Locale, SupportCopy> = { en, lt };

export function supportCopy(locale: Locale): SupportCopy {
  return SUPPORT[locale];
}
