"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setAdminSession, clearAdminSession } from "@/lib/auth";
import { z } from "zod";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const loginSchema = z.object({
  email: z
    .string()
    .max(254, "Email is too long.")
    .refine((v) => EMAIL_RE.test(v.trim().toLowerCase()), "Enter a valid email address."),
  password: z.string().min(1, "Please provide both email and password.").max(200),
});

export async function loginAdminAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid login details.",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== "ADMIN") {
      return { success: false as const, error: "Invalid credentials or unauthorized account." };
    }

    const isValid = await bcrypt.compare(parsed.data.password, user.password);
    if (!isValid) {
      return { success: false as const, error: "Invalid credentials or unauthorized account." };
    }

    await setAdminSession(user.id);
    return { success: true as const };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false as const, error: "An unexpected error occurred during login." };
  }
}

export async function logoutAdminAction() {
  await clearAdminSession();
  return { success: true as const };
}
