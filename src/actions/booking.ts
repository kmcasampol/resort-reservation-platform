"use server";

import { prisma } from "@/lib/prisma";
import { BookingSubmission, BookingDetail } from "@/types";
import { differenceInCalendarDays, parseISO, startOfDay, addDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

const PAYMENT_METHODS = ["GCASH", "CREDIT_CARD", "CASH_ON_ARRIVAL"] as const;
const MAX_NIGHTS = 365;
const BOOKING_CODE_ATTEMPTS = 5;

/** Unambiguous alphabet: no 0/O or 1/I, so codes stay readable over the phone. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Everything a Server Action receives is untrusted JSON — the `BookingSubmission`
 * TypeScript type is erased at the boundary. This schema is the real gate.
 */
const bookingSubmissionSchema = z.object({
  accommodationId: z.string().min(1, "Missing accommodation."),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date."),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date."),
  guestCount: z
    .number({ message: "Guest count must be a number." })
    .int("Guest count must be a whole number.")
    .min(1, "At least one guest is required.")
    .max(100, "Guest count is out of range."),
  guestName: z.string().min(2, "Please enter the guest's full name.").max(120),
  guestEmail: z.string().max(254).refine((v) => EMAIL_RE.test(v.trim()), "Enter a valid email address."),
  guestPhone: z
    .string()
    .min(7, "Enter a valid contact number.")
    .max(30, "Contact number is too long."),
  notes: z.string().max(1000, "Notes are too long.").optional().default(""),
  selectedAmenities: z
    .array(
      z.object({
        amenityId: z.string().min(1),
        quantity: z
          .number()
          .int("Add-on quantity must be a whole number.")
          .min(1, "Add-on quantity must be at least 1.")
          .max(999, "Add-on quantity is too large."),
      })
    )
    .max(30, "Too many add-ons selected.")
    .optional()
    .default([]),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    message: `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}.`,
  }),
  paymentReference: z.string().trim().max(64, "Payment reference is too long.").optional(),
});

class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

function isBookingCodeCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as string[]).includes("bookingCode")
  );
}

function generateBookingCode(): string {
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < bytes.length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `RES-${new Date().getFullYear()}-${code}`;
}

/** Date-only strings compared as calendar days, never as timestamps. */
function isSameOrBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() <= startOfDay(b).getTime();
}

export async function checkAccommodationAvailability(
  accommodationId: string,
  checkInStr: string,
  checkOutStr: string
): Promise<{ available: boolean; message?: string }> {
  // Check-in / check-out are calendar dates. Truncate to local midnight so the
  // overlap test compares days, not wall-clock times (see below).
  const checkIn = startOfDay(parseISO(checkInStr));
  const checkOut = startOfDay(parseISO(checkOutStr));

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return { available: false, message: "Please provide valid dates." };
  }

  if (!isSameOrBefore(addDays(checkIn, 1), checkOut)) {
    return { available: false, message: "Check-out date must be after check-in date." };
  }

  // Check accommodation exists and is AVAILABLE
  const accommodation = await prisma.accommodation.findUnique({
    where: { id: accommodationId },
  });

  if (!accommodation || accommodation.status !== "AVAILABLE") {
    return {
      available: false,
      message: "This accommodation is currently under maintenance or unavailable.",
    };
  }

  const overlappingReservation = await findOverlappingReservation(
    prisma,
    accommodationId,
    checkIn,
    checkOut
  );

  if (overlappingReservation) {
    return {
      available: false,
      message: "Accommodation is already reserved for the selected dates.",
    };
  }

  return { available: true };
}

/**
 * Shared overlap query. Half-open interval `[checkIn, checkOut)` so a guest
 * checking out the same day another checks in does not collide.
 *
 * `PENDING` and `CONFIRMED` block inventory; `CANCELLED` / `COMPLETED` do not.
 *
 * Both bounds must already be truncated to local midnight: reservation dates
 * are date-only concepts, and comparing raw timestamps (which carry the time of
 * day the booking happened to be created at) shifts every boundary.
 *
 * Accepts either the root client or a transaction client so the exact same
 * predicate is used for the pre-flight check and the in-transaction re-check.
 */
type Db = Pick<Prisma.TransactionClient, "reservation">;

async function findOverlappingReservation(
  db: Db,
  accommodationId: string,
  checkIn: Date,
  checkOut: Date
) {
  return db.reservation.findFirst({
    where: {
      status: { in: ["CONFIRMED", "PENDING"] },
      items: { some: { accommodationId } },
      AND: [{ checkInDate: { lt: checkOut } }, { checkOutDate: { gt: checkIn } }],
    },
    select: { bookingCode: true },
  });
}

export async function createBooking(submission: BookingSubmission) {
  try {
    // ---- 1. Runtime validation (TS types do not exist on the server) ----
    const parsed = bookingSubmissionSchema.safeParse(submission);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { success: false, error: first?.message ?? "Please review the reservation form." };
    }
    const data = parsed.data;

    const checkIn = startOfDay(parseISO(data.checkInDate));
    const checkOut = startOfDay(parseISO(data.checkOutDate));

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return { success: false, error: "Please provide valid dates." };
    }

    const today = startOfDay(new Date());
    if (startOfDay(checkIn).getTime() < today.getTime()) {
      return { success: false, error: "Check-in date cannot be in the past." };
    }

    const nights = differenceInCalendarDays(checkOut, checkIn);
    if (nights < 1) {
      return {
        success: false,
        error: "Check-out date must be at least 1 day after check-in.",
      };
    }
    if (nights > MAX_NIGHTS) {
      return { success: false, error: `Stays are limited to ${MAX_NIGHTS} nights.` };
    }

    // ---- 2. Load + validate referenced records ----
    const accommodation = await prisma.accommodation.findUnique({
      where: { id: data.accommodationId },
    });

    if (!accommodation) {
      return { success: false, error: "Accommodation not found." };
    }
    if (accommodation.status !== "AVAILABLE") {
      return {
        success: false,
        error: "This accommodation is currently under maintenance or unavailable.",
      };
    }
    if (data.guestCount > accommodation.capacity) {
      return {
        success: false,
        error: `Selected unit maximum capacity is ${accommodation.capacity} guests.`,
      };
    }

    // ---- 3. Resolve the guest account ----
    const guestEmail = data.guestEmail.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: guestEmail } });

    if (!user) {
      try {
        const defaultPassword = await bcrypt.hash(
          // Booking is a guest-only flow; there is no guest login in this app.
          // See README "Known limitations".
          randomBytes(16).toString("hex"),
          10
        );
        user = await prisma.user.create({
          data: {
            email: guestEmail,
            name: data.guestName.trim(),
            password: defaultPassword,
            role: "GUEST",
            phone: data.guestPhone.trim(),
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          user = await prisma.user.findUnique({ where: { email: guestEmail } });
        }
        if (!user) throw error;
      }
    }

    // ---- 4. Price add-ons from the database, never from the client ----
    const selectedAmenities = data.selectedAmenities;
    let amenitiesTotal = 0;
    const amenityItemsToCreate: { amenityId: string; quantity: number; subtotal: number }[] = [];

    if (selectedAmenities.length > 0) {
      const amenities = await prisma.amenity.findMany({
        where: { id: { in: selectedAmenities.map((a) => a.amenityId) } },
      });

      for (const sel of selectedAmenities) {
        const found = amenities.find((a) => a.id === sel.amenityId);
        if (!found) {
          return { success: false, error: "One of the selected add-ons no longer exists." };
        }
        const subtotal = found.price * sel.quantity;
        amenitiesTotal += subtotal;
        amenityItemsToCreate.push({
          amenityId: found.id,
          quantity: sel.quantity,
          subtotal,
        });
      }
    }

    const accommodationTotal = accommodation.pricePerNight * nights;
    const grandTotal = accommodationTotal + amenitiesTotal;
    const isPaid = data.paymentMethod !== "CASH_ON_ARRIVAL";
    const paymentStatus: "PAID" | "PENDING" = isPaid ? "PAID" : "PENDING";
    const reservationStatus: "CONFIRMED" | "PENDING" = isPaid ? "CONFIRMED" : "PENDING";

    // ---- 5. Commit: the conflict check now happens INSIDE the transaction ----
    // The previous design ran the availability query before opening the
    // transaction, so two simultaneous submissions could both pass and both
    // insert (a classic TOCTOU double-booking race).
    for (let attempt = 1; attempt <= BOOKING_CODE_ATTEMPTS; attempt++) {
      try {
        const reservation = await prisma.$transaction(async (tx) => {
          // Re-read inside the transaction: status may have changed to
          // MAINTENANCE since step 2.
          const current = await tx.accommodation.findUnique({
            where: { id: data.accommodationId },
            select: { status: true },
          });
          if (!current || current.status !== "AVAILABLE") {
            throw new BookingConflictError(
              "This accommodation was just made unavailable. Please pick another unit."
            );
          }

          const conflict = await findOverlappingReservation(
            tx,
            data.accommodationId,
            checkIn,
            checkOut
          );
          if (conflict) {
            throw new BookingConflictError(
              "Accommodation is already reserved for the selected dates."
            );
          }

          return tx.reservation.create({
            data: {
              bookingCode: generateBookingCode(),
              userId: user.id,
              checkInDate: checkIn,
              checkOutDate: checkOut,
              guestCount: data.guestCount,
              totalAmount: grandTotal,
              status: reservationStatus,
              notes: data.notes?.trim() || null,
              items: {
                create: [
                  {
                    accommodationId: accommodation.id,
                    quantity: nights,
                    subtotal: accommodationTotal,
                  },
                  ...amenityItemsToCreate.map((item) => ({
                    amenityId: item.amenityId,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                  })),
                ],
              },
              payment: {
                create: {
                  method: data.paymentMethod,
                  status: paymentStatus,
                  amount: grandTotal,
                  referenceNumber: isPaid
                    ? data.paymentReference ||
                      `${data.paymentMethod}-${randomBytes(4).toString("hex").toUpperCase()}`
                    : null,
                  paidAt: isPaid ? new Date() : null,
                },
              },
            },
          });
        });

        return {
          success: true as const,
          bookingCode: reservation.bookingCode,
          reservationId: reservation.id,
        };
      } catch (error) {
        // 1-in-a-billion code collision: roll back and try a fresh code.
        if (isBookingCodeCollision(error) && attempt < BOOKING_CODE_ATTEMPTS) {
          continue;
        }
        throw error;
      }
    }

    return { success: false as const, error: "Could not allocate a booking code. Please retry." };
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return { success: false, error: error.message };
    }
    console.error("Booking creation failed:", error);
    return { success: false, error: "Failed to create reservation. Please try again." };
  }
}

export async function getBookingByCode(bookingCode: string): Promise<BookingDetail | null> {
  try {
    const normalized = bookingCode.trim().toUpperCase();
    if (!normalized || normalized.length > 40) return null;

    const reservation = await prisma.reservation.findUnique({
      where: { bookingCode: normalized },
      include: {
        user: {
          select: { name: true, email: true, phone: true },
        },
        items: {
          include: {
            accommodation: {
              select: { name: true, type: true, pricePerNight: true, imageUrl: true },
            },
            amenity: {
              select: { name: true, category: true, price: true, unit: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!reservation) return null;
    return reservation as unknown as BookingDetail;
  } catch (error) {
    console.error("Failed to lookup booking:", error);
    return null;
  }
}

export async function cancelGuestBooking(bookingCode: string, email: string) {
  try {
    const normalizedCode = bookingCode.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedCode || !EMAIL_RE.test(normalizedEmail)) {
      return { success: false, error: "Please provide a valid booking code and email." };
    }

    const reservation = await prisma.reservation.findUnique({
      where: { bookingCode: normalizedCode },
      include: { user: true },
    });

    if (!reservation) {
      return { success: false, error: "Reservation not found." };
    }

    if (reservation.user.email.toLowerCase() !== normalizedEmail) {
      return { success: false, error: "Email does not match this reservation." };
    }

    if (reservation.status === "COMPLETED" || reservation.status === "CANCELLED") {
      return {
        success: false,
        error: `Cannot cancel a reservation that is already ${reservation.status}.`,
      };
    }

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: "CANCELLED" },
      }),
      // Money already collected for a cancelled stay is refunded, so it stops
      // counting as settled revenue (revenue = payments still marked PAID).
      prisma.payment.updateMany({
        where: { reservationId: reservation.id, status: "PAID" },
        data: { status: "REFUNDED", paidAt: null },
      }),
    ]);

    return { success: true };
  } catch (err) {
    console.error("Cancellation error:", err);
    return { success: false, error: "Failed to cancel reservation." };
  }
}
