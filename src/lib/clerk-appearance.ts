import { dark } from "@clerk/themes";

export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#f2c94c",
    // Text on the accent button: the page background — use dark background color for contrast.
    colorPrimaryForeground: "#0a0b0f",
    colorNeutral: "#525252",
    colorRing: "#f2c94c",
    colorShimmer: "#252935",
    // Square corners, matching the public site's move away from
    // soft/rounded surfaces everywhere else.
    borderRadius: "0rem",
    spacingUnit: "0.5rem",
  },
  elements: {
    // "Manage account" / "Sign out" in the account menu — `colorNeutral`
    // above renders these too dark to read against the popover background.
    // Targeted here rather than raising `colorNeutral` globally, which would
    // also lighten borders and dividers that are fine as they are.
    //
    // There is no "...ActionButtonText" element — the button itself is the
    // element Clerk assigns a class to, and the text inside inherits its
    // colour from it. The first attempt at this used a key that does not
    // exist in this Clerk version, which silently did nothing.
    userButtonPopoverActionButton: { color: "#f2c94c" },
    userButtonPopoverActionButtonIcon: { color: "#f2c94c" },

    // The sign-in/sign-up card's header and primary button, in the same
    // mono/uppercase voice as the rest of the public site.
    headerTitle: "font-mono uppercase tracking-tight",
    formButtonPrimary: "font-mono uppercase tracking-wide",
    socialButtonsBlockButtonText: "font-mono",
    formFieldLabel: "font-mono text-xs uppercase tracking-wide",
  },
};
