/**
 * Who may read the operator's admin panel — revenue, member count, recent
 * activity.
 *
 * Same shape as `isSupportReader`, deliberately kept separate: reading a
 * support ticket and reading the business's revenue are different things to
 * be trusted with, even when today they are the same one person. With the
 * variable unset nobody can reach the panel, including the operator — failing
 * closed is the right default for a page that shows what the business made.
 */
export function isAdmin(userId: string | null): boolean {
  if (!userId) return false;

  const allowed = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");

  return allowed.includes(userId);
}
