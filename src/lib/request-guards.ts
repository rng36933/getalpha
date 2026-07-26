import { NextResponse } from "next/server";

/**
 * Rejects anything that is not a JSON request.
 *
 * Defence in depth against cross-site request forgery. The first line is
 * Clerk's session cookie, which is `SameSite=Lax` and therefore not attached
 * to a cross-site POST at all — an attacker's hidden form arrives with no
 * session and gets 401.
 *
 * This closes the gap behind it. An HTML form can only send three content
 * types, none of them JSON, but `request.json()` parses whatever bytes it is
 * given — so a form using `enctype="text/plain"` can post a body that happens
 * to be valid JSON. Requiring the header means such a request is refused
 * before its body is read, because a form cannot set it and `fetch` from
 * another origin cannot either without passing a CORS preflight this app
 * never answers.
 */
export function requireJsonRequest(request: Request): NextResponse | null {
  const contentType = request.headers.get("content-type") ?? "";

  // Match the media type only; charset and boundary parameters are legitimate.
  if (contentType.split(";")[0]?.trim().toLowerCase() === "application/json") {
    return null;
  }

  return NextResponse.json(
    { error: "Content-Type must be application/json" },
    { status: 415 },
  );
}
