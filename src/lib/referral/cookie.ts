/**
 * The cookie that carries an invite code from the landing page to sign-up.
 *
 * Its own module so both the middleware and the server components can import
 * the name without importing each other — middleware runs on the edge runtime
 * and pulling a page module into it would pull half the app with it.
 */
export const REFERRAL_COOKIE = "ga_ref";

/** Long enough that reading about it and coming back next week still counts. */
export const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

/** Codes come from `generateReferralCode`; this is the same alphabet and length. */
export const REFERRAL_CODE_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;
