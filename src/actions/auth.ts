"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setUserSession, clearUserSession, getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const loginSchema = z.object({
  email: z
    .string()
    .max(254, "Email is too long.")
    .refine((v) => EMAIL_RE.test(v.trim().toLowerCase()), "Enter a valid email address."),
  password: z.string().min(1, "Please provide both email and password.").max(200),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100, "Name is too long."),
  email: z
    .string()
    .max(254, "Email is too long.")
    .refine((v) => EMAIL_RE.test(v.trim().toLowerCase()), "Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters.").max(200),
  phone: z.string().trim().min(7, "Phone number is too short.").max(30).optional().or(z.literal("")),
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

    await setUserSession(user.id);
    return { success: true as const };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false as const, error: "An unexpected error occurred during login." };
  }
}

/**
 * Guest login action.
 */
export async function loginUserAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid email or password.",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false as const, error: "Invalid email or password." };
    }

    const isValid = await bcrypt.compare(parsed.data.password, user.password);
    if (!isValid) {
      return { success: false as const, error: "Invalid email or password." };
    }

    await setUserSession(user.id);
    return {
      success: true as const,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    };
  } catch (err) {
    console.error("User login error:", err);
    return { success: false as const, error: "An unexpected error occurred during login." };
  }
}

/**
 * Guest account creation / registration action.
 */
export async function registerUserAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid registration details.",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name.trim();
  const phone = parsed.data.phone ? parsed.data.phone.trim() : null;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return {
        success: false as const,
        error: "An account with this email already exists. Please sign in instead.",
      };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: "GUEST",
      },
    });

    // Auto-login upon registration
    await setUserSession(user.id);

    return {
      success: true as const,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    };
  } catch (err) {
    console.error("Registration error:", err);
    return { success: false as const, error: "Failed to create account. Please try again." };
  }
}

export async function logoutUserAction() {
  await clearUserSession();
  return { success: true as const };
}

export const logoutAdminAction = logoutUserAction;

export async function getSessionAction() {
  return await getCurrentUser();
}
