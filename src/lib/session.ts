import { SignJWT, jwtVerify } from "jose";

/**
 * Session-token primitives.
 *
 * Deliberately free of `next/headers`, `next/navigation` and Prisma so that
 * `src/proxy.ts` can verify a cookie on the network edge without pulling the
 * database client or page-level APIs into the proxy bundle.
 */

export const COOKIE_NAME = "resort_admin_token";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Secret used to sign the admin session cookie.
 *
 * - In production a real secret is mandatory: a missing/short value is a hard
 *   error rather than a silently weak fallback.
 * - Locally we fall back to a fixed dev value so `npm run dev` works out of the
 *   box even before `.env` is populated.
 */
export function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a value of at least 16 characters in production."
    );
  }
  return new TextEncoder().encode("resort-azure-dev-session-secret");
}

/**
 * Verifies the signature + expiry of a session token *without* touching the
 * database. This is what `proxy.ts` uses so anonymous requests never pay for a
 * Prisma round-trip.
 */
export async function verifySessionToken(token: string): Promise<{ sub?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer("solara-azure-resort")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());
}
