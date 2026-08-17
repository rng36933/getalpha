/**
 * Clerk's default SignIn/SignUp card is a soft, rounded, light-on-white
 * widget — the opposite of the sharp, dark, mono-numbered surface the rest
 * of the public site uses. This makes it match: square corners, the same
 * dark surface/border tokens, and font-mono on the header and labels.
 */
export const clerkAppearance = {
  elements: {
    card: "bg-[#13151c] border border-zinc-800 rounded-none shadow-none",
    headerTitle: "text-white font-mono uppercase tracking-tight text-xl",
    headerSubtitle: "text-zinc-500 font-sans text-sm",

    socialButtonsBlockButton: "border border-zinc-800 rounded-none bg-[#0a0b0f] hover:bg-zinc-900",
    socialButtonsBlockButtonText: "text-zinc-300 font-mono",
    dividerLine: "bg-zinc-800",
    dividerText: "text-zinc-600 font-mono text-xs",

    formFieldLabel: "text-zinc-400 font-mono text-xs uppercase tracking-wide",
    formFieldInput: "bg-[#0a0b0f] border border-zinc-800 rounded-none text-white",

    formButtonPrimary: "bg-[#f2c94c] hover:bg-[#e0ba43] text-black font-mono uppercase tracking-wide rounded-none shadow-none",

    footerActionText: "text-zinc-500 font-sans text-xs",
    footerActionLink: "text-[#f2c94c] hover:underline font-mono text-xs",
  },
} as const;
