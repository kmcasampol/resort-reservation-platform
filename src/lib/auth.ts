import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, SESSION_TTL_SECONDS, signSessionToken, verifySessionToken } from "@/lib/session";

export { COOKIE_NAME, verifySessionToken } from "@/lib/session";

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
};

export type AdminSession = UserSession;

export async function setUserSession(userId: string) {
  const token = await signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export const setAdminSession = setUserSession;

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export const clearAdminSession = clearUserSession;

/**
 * Resolves the currently authenticated session for any user (guest or admin).
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    return user;
  } catch (error) {
    console.error("Session lookup error:", error);
    return null;
  }
}

/**
 * Resolves the current admin session.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const user = await getCurrentUser();
  if (user && user.role === "ADMIN") {
    return user;
  }
  return null;
}

/** Page-level guard: bounce unauthenticated visitors to the login screen. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Server-Action-level guard for Admin operations.
 */
export async function assertAdmin(): Promise<
  { ok: true; session: AdminSession } | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, error: "Your admin session has expired. Please sign in again." };
  }
  return { ok: true, session };
}
