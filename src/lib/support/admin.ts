/**
 * Who may read submitted support tickets.
 *
 * A list of Clerk user ids in an environment variable, not a role in the
 * database. There is one operator and no admin interface to manage roles with,
 * so a table of permissions would be a table with one row and a way to get it
 * wrong. When there is a second person, this becomes a real role.
 *
 * With the variable unset nobody can read tickets — including the operator.
 * Failing closed is the right default for a page that shows what other people
 * have written.
 */
export function isSupportReader(userId: string | null): boolean {
  if (!userId) return false;

  const allowed = (process.env.SUPPORT_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "");

  return allowed.includes(userId);
}
