import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/nextjs";

// Clerk v7 publishes the appearance type through a global registry that the
// framework package augments, so it has no stable import path. Taking it off
// the provider's own props is the one spelling that cannot drift.
type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

/**
 * The sign-in and sign-up cards, dressed in the app's palette.
 *
 * Clerk renders its own markup, so the only way in is `appearance`. The values
 * mirror `globals.css` rather than importing from it: Clerk's variables are
 * read in JavaScript before the stylesheet applies, and a `var(--surface)`
 * that resolves to nothing silently falls back to Clerk's light default.
 * `fontFamily` is the exception — Next's font loader defines that custom
 * property on `<html>`, which is already in the document when the card mounts.
 *
 * Variable names are the Clerk v7 set (`colorForeground`, `colorInput`,
 * `colorMutedForeground`); the v6 names are gone and pass silently as unknown
 * keys, which is how a card ends up looking untouched.
 */
export const clerkAppearance: Appearance = {
  variables: {
    // The card sits on --background, so it takes --surface to lift off it.
    colorBackground: "#13151c",
    colorForeground: "#e9ebf0",
    colorMuted: "#191c25",
    colorMutedForeground: "#8a90a0",

    colorPrimary: "#5b8cff",
    // Text on the accent button: the page background, not white — #5b8cff is
    // too light to carry white text at the contrast we hold elsewhere.
    colorPrimaryForeground: "#0a0b0f",

    // Inputs recede into the page rather than sitting proud of the card.
    colorInput: "#0a0b0f",
    colorInputForeground: "#e9ebf0",

    colorBorder: "#252935",
    colorRing: "#5b8cff",
    colorShimmer: "#252935",
    colorModalBackdrop: "rgba(10, 11, 15, 0.72)",

    // Base for the shades Clerk derives itself. On a dark surface those shades
    // have to be lightening steps, so the neutral is light.
    colorNeutral: "#e9ebf0",

    colorDanger: "#f87171",
    colorSuccess: "#34d399",
    colorWarning: "#fbbf24",

    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    // Clerk's default drop shadow is tuned for a white page and reads as a
    // grey halo on this one.
    cardBox: {
      border: "1px solid #252935",
      boxShadow: "none",
    },
  },
};
