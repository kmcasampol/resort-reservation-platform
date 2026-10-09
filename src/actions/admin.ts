"use server";

import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addDays, startOfDay } from "date-fns";
import { z } from "zod";

/**
 * NOTE ON AUTHORIZATION
 * ---------------------
 * Server Actions are reachable by direct POST, independent of the UI, and a
 * `proxy.ts` matcher can be bypassed by a refactor. Every exported function in
 * this file therefore re-verifies the admin session itself.
 */
const RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
const ACCOMMODATION_STATUSES = ["AVAILABLE", "MAINTENANCE"] as const;

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80";

const imageSchema = z
  .string()
  .trim()
  .max(500, "Image URL is too long.")
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Image URL must start with http(s)://");

const accommodationSchema = z.object({
  name: z.string().trim().min(3, "Unit name is too short.").max(80, "Unit name is too long."),
  type: z.enum(["ROOM", "COTTAGE", "VILLA"], { message: "Invalid accommodation type." }),
  pricePerNight: z.coerce
    .number({ message: "Price must be a number." })
    .min(0, "Price cannot be negative.")
    .max(1_000_000, "Price is out of range."),
  capacity: z.coerce
    .number({ message: "Capacity must be a number." })
    .int("Capacity must be a whole number.")
    .min(1, "Capacity must be at least 1.")
    .max(100, "Capacity cannot exceed 100."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(600, "Description is too long."),
  imageUrl: imageSchema.optional().default(""),
  status: z.enum(ACCOMMODATION_STATUSES).optional(),
});

const amenitySchema = z.object({
  name: z.string().trim().min(3, "Amenity name is too short.").max(80, "Amenity name is too long."),
  category: z.enum(["EVENT_HALL", "POOL_PASS", "FOOD_PACKAGE", "ACTIVITY"], {
    message: "Invalid amenity category.",
  }),
  price: z.coerce
    .number({ message: "Price must be a number." })
    .min(0, "Price cannot be negative.")
    .max(1_000_000, "Price is out of range."),
  unit: z.enum(["PER_PERSON", "PER_HOUR", "PER_DAY"], { message: "Invalid billing unit." }),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(600, "Description is too long."),
  imageUrl: imageSchema.optional(),
});

const statusUpdateSchema = z.object({
  reservationId: z.string().min(1),
  status: z.enum(RESERVATION_STATUSES, {
    message: `Status must be one of: ${RESERVATION_STATUSES.join(", ")}.`,
  }),
});

function firstError(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

/** Rolling window used by the occupancy KPI and the calendar view. */
const OCCUPANCY_WINDOW_DAYS = 30;

export async function getAdminOverview() {
  const guard = await assertAdmin();
  if (!guard.ok) throw new Error(guard.error);

  const [
    totalReservations,
    confirmedReservations,
    pendingReservations,
    completedReservations,
    cancelledReservations,
    accommodationsCount,
    amenitiesCount,
    recentReservations,
    paidPayments,
    occupancyReservations,
  ] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: "CONFIRMED" } }),
    prisma.reservation.count({ where: { status: "PENDING" } }),
    prisma.reservation.count({ where: { status: "COMPLETED" } }),
    prisma.reservation.count({ where: { status: "CANCELLED" } }),
    prisma.accommodation.count(),
    prisma.amenity.count(),
    prisma.reservation.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            accommodation: { select: { name: true, type: true } },
            amenity: { select: { name: true } },
          },
        },
        payment: true,
      },
    }),
    prisma.payment.findMany({
      // A refunded/failed capture is not revenue. Defence in depth: also skip
      // anything whose reservation has since been cancelled.
      where: { status: "PAID", reservation: { status: { not: "CANCELLED" } } },
      select: { amount: true },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "PENDING"] },
        checkInDate: { lt: addDays(startOfDay(new Date()), OCCUPANCY_WINDOW_DAYS) },
        checkOutDate: { gt: startOfDay(new Date()) },
      },
      select: { checkInDate: true, checkOutDate: true },
    }),
  ]);

  const totalRevenue = paidPayments.reduce((acc, curr) => acc + curr.amount, 0);

  // Occupancy = booked unit-nights / (units x window) over the next 30 days.
  const windowStart = startOfDay(new Date()).getTime();
  const windowEnd = addDays(startOfDay(new Date()), OCCUPANCY_WINDOW_DAYS).getTime();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const bookedUnitNights = occupancyReservations.reduce((total, res) => {
    const from = Math.max(new Date(res.checkInDate).getTime(), windowStart);
    const to = Math.min(new Date(res.checkOutDate).getTime(), windowEnd);
    return total + Math.max(0, Math.round((to - from) / DAY_MS));
  }, 0);
  const capacityUnitNights = accommodationsCount * OCCUPANCY_WINDOW_DAYS;
  const occupancyRate =
    capacityUnitNights > 0 ? Math.round((bookedUnitNights / capacityUnitNights) * 100) : 0;

  return {
    totalReservations,
    confirmedReservations,
    pendingReservations,
    completedReservations,
    cancelledReservations,
    totalRevenue,
    accommodationsCount,
    amenitiesCount,
    recentReservations,
    occupancyRate,
    bookedUnitNights,
    capacityUnitNights,
    occupancyWindowDays: OCCUPANCY_WINDOW_DAYS,
  };
}

/* ------------------------------------------------------------------ */
/* Reservations                                                        */
/* ------------------------------------------------------------------ */

export async function getAdminReservations(status?: string) {
  const guard = await assertAdmin();
  if (!guard.ok) throw new Error(guard.error);

  const whereClause = status && status !== "ALL" ? { status } : {};

  return await prisma.reservation.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        include: {
          accommodation: { select: { name: true, type: true, pricePerNight: true } },
          amenity: { select: { name: true, category: true, price: true } },
        },
      },
      payment: true,
    },
  });
}

export async function updateReservationStatus(reservationId: string, status: string) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false as const, error: guard.error };

    const parsed = statusUpdateSchema.safeParse({ reservationId, status });
    if (!parsed.success) {
      return { success: false as const, error: firstError(parsed.error, "Invalid status.") };
    }

    const reservation = await prisma.reservation.update({
      where: { id: parsed.data.reservationId },
      data: { status: parsed.data.status },
      include: { payment: true },
    });

    if (reservation.payment) {
      if (parsed.data.status === "CANCELLED" && reservation.payment.status === "PAID") {
        // Cancelled + already captured => refund, so revenue drops accordingly.
        await prisma.payment.update({
          where: { id: reservation.payment.id },
          data: { status: "REFUNDED", paidAt: null },
        });
      } else if (
        parsed.data.status === "COMPLETED" &&
        reservation.payment.status === "PENDING"
      ) {
        // Cash-on-arrival settled at the front desk on check-out.
        await prisma.payment.update({
          where: { id: reservation.payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/reservations");
    revalidatePath("/admin/calendar");
    return { success: true as const };
  } catch (error) {
    console.error("Failed to update reservation status:", error);
    return { success: false as const, error: "Failed to update status." };
  }
}

/* ------------------------------------------------------------------ */
/* Occupancy calendar                                                  */
/* ------------------------------------------------------------------ */

const calendarRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Reservations overlapping `[start, end)` plus the unit list, for the month grid. */
export async function getCalendarData(start: string, end: string) {
  const guard = await assertAdmin();
  if (!guard.ok) throw new Error(guard.error);

  const parsed = calendarRangeSchema.safeParse({ start, end });
  if (!parsed.success) return { accommodations: [], reservations: [] };

  const [accommodations, reservations] = await Promise.all([
    prisma.accommodation.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, type: true, status: true, pricePerNight: true },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: ["CONFIRMED", "PENDING"] },
        checkInDate: { lt: new Date(parsed.data.end) },
        checkOutDate: { gt: new Date(parsed.data.start) },
      },
      orderBy: { checkInDate: "asc" },
      select: {
        id: true,
        bookingCode: true,
        status: true,
        checkInDate: true,
        checkOutDate: true,
        guestCount: true,
        user: { select: { name: true } },
        items: {
          where: { accommodationId: { not: null } },
          select: { accommodationId: true, accommodation: { select: { name: true } } },
        },
      },
    }),
  ]);

  return { accommodations, reservations };
}

/* ------------------------------------------------------------------ */
/* Accommodations                                                      */
/* ------------------------------------------------------------------ */

export async function getAccommodations() {
  const guard = await assertAdmin();
  if (!guard.ok) throw new Error(guard.error);

  return await prisma.accommodation.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function createAccommodation(input: unknown) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false as const, error: guard.error };

    const parsed = accommodationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: firstError(parsed.error, "Invalid unit data.") };
    }

    const data = parsed.data;
    const item = await prisma.accommodation.create({
      data: {
        name: data.name,
        type: data.type,
        pricePerNight: data.pricePerNight,
        capacity: data.capacity,
        description: data.description,
        imageUrl: data.imageUrl || DEFAULT_IMAGE,
        status: data.status ?? "AVAILABLE",
      },
    });
    revalidatePath("/admin/accommodations");
    revalidatePath("/admin/calendar");
    revalidatePath("/");
    return { success: true as const, accommodation: item };
  } catch (error) {
    console.error("Create accommodation error:", error);
    return { success: false as const, error: "Failed to create accommodation." };
  }
}

export async function updateAccommodation(id: string, input: unknown) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false as const, error: guard.error };

    if (!id) return { success: false as const, error: "Missing accommodation id." };

    const parsed = accommodationSchema.partial().safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: firstError(parsed.error, "Invalid unit data.") };
    }

    const data = { ...parsed.data };
    // A blank URL means "use the default photo", never an empty image.
    if (data.imageUrl === "") {
      data.imageUrl = DEFAULT_IMAGE;
    }

    await prisma.accommodation.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/accommodations");
    revalidatePath("/admin/calendar");
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("Update accommodation error:", error);
    return { success: false as const, error: "Failed to update accommodation." };
  }
}

export async function deleteAccommodation(id: string) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false as const, error: guard.error };

    if (!id) return { success: false as const, error: "Missing accommodation id." };

    // The schema declares `onDelete: SetNull`, so a hard delete would silently
    // erase the unit from every historical receipt. Block it instead.
    const referenced = await prisma.reservationItem.count({
      where: { accommodationId: id },
    });
    if (referenced > 0) {
      return {
        success: false as const,
        error: `This unit appears on ${referenced} reservation item(s). Set it to Maintenance instead of deleting it.`,
      };
    }

    await prisma.accommodation.delete({ where: { id } });
    revalidatePath("/admin/accommodations");
    revalidatePath("/admin/calendar");
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("Delete accommodation error:", error);
    return { success: false as const, error: "Failed to delete accommodation." };
  }
}

/* ------------------------------------------------------------------ */
/* Amenities                                                           */
/* ------------------------------------------------------------------ */

export async function getAmenities() {
  const guard = await assertAdmin();
  if (!guard.ok) throw new Error(guard.error);

  return await prisma.amenity.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function createAmenity(input: unknown) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false as const, error: guard.error };

    const parsed = amenitySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: firstError(parsed.error, "Invalid amenity data.") };
    }

    const data = parsed.data;
    const item = await prisma.amenity.create({
      data: {
        name: data.name,
        category: data.category,
        price: data.price,
        unit: data.unit,
        description: data.description,
        imageUrl: data.imageUrl || null,
      },
    });
    revalidatePath("/admin/amenities");
    revalidatePath("/");
    return { success: true as const, amenity: item };
  } catch (error) {
    console.error("Create amenity error:", error);
    return { success: false as const, error: "Failed to create amenity." };
  }
}

export async function updateAmenity(id: string, input: unknown) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false as const, error: guard.error };

    if (!id) return { success: false as const, error: "Missing amenity id." };

    const parsed = amenitySchema.partial().safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: firstError(parsed.error, "Invalid amenity data.") };
    }

    const data = {
      ...parsed.data,
      // Empty string means "no photo", not an empty URL.
      imageUrl: parsed.data.imageUrl === "" ? null : parsed.data.imageUrl,
    };

    await prisma.amenity.update({ where: { id }, data });
    revalidatePath("/admin/amenities");
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("Update amenity error:", error);
    return { success: false as const, error: "Failed to update amenity." };
  }
}

export async function deleteAmenity(id: string) {
  try {
    const guard = await assertAdmin();
    if (!guard.ok) return { success: false as const, error: guard.error };

    if (!id) return { success: false as const, error: "Missing amenity id." };

    const referenced = await prisma.reservationItem.count({ where: { amenityId: id } });
    if (referenced > 0) {
      return {
        success: false as const,
        error: `This add-on appears on ${referenced} reservation item(s) and cannot be deleted.`,
      };
    }

    await prisma.amenity.delete({ where: { id } });
    revalidatePath("/admin/amenities");
    revalidatePath("/");
    return { success: true as const };
  } catch (error) {
    console.error("Delete amenity error:", error);
    return { success: false as const, error: "Failed to delete amenity." };
  }
}
