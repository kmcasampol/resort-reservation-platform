import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing records
  await prisma.payment.deleteMany();
  await prisma.reservationItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.accommodation.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const guestPassword = await bcrypt.hash("guest123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@resort.com",
      name: "Resort Manager",
      password: adminPassword,
      role: "ADMIN",
      phone: "+63 912 345 6789",
    },
  });

  const guest = await prisma.user.create({
    data: {
      email: "guest@example.com",
      name: "Juan Dela Cruz",
      password: guestPassword,
      role: "GUEST",
      phone: "+63 998 765 4321",
    },
  });

  console.log(`Created admin: ${admin.email} and guest: ${guest.email}`);

  // 2. Create Accommodations
  const villa = await prisma.accommodation.create({
    data: {
      name: "Grand Beachfront Villa",
      type: "VILLA",
      pricePerNight: 8500,
      capacity: 8,
      description: "Luxurious private beachfront villa featuring panoramic ocean views, private dipping pool, and master sundeck.",
      imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      status: "AVAILABLE",
    },
  });

  const cottage = await prisma.accommodation.create({
    data: {
      name: "Tropical Bamboo Cottage",
      type: "COTTAGE",
      pricePerNight: 3500,
      capacity: 4,
      description: "Authentic, breezy bamboo cottage surrounded by lush tropical gardens, complete with hammocks and private patio.",
      imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      status: "AVAILABLE",
    },
  });

  const suite = await prisma.accommodation.create({
    data: {
      name: "Executive Oceanview Suite",
      type: "ROOM",
      pricePerNight: 4800,
      capacity: 2,
      description: "Modern suite equipped with a king-sized bed, marble ensuite bathroom, and a balcony overlooking the sunset horizon.",
      imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      status: "AVAILABLE",
    },
  });

  const familyRoom = await prisma.accommodation.create({
    data: {
      name: "Family Garden Lodge",
      type: "ROOM",
      pricePerNight: 5200,
      capacity: 6,
      description: "Spacious dual-bedroom lodge ideal for family retreats, located near the playground and central resort pools.",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      status: "AVAILABLE",
    },
  });

  console.log("Accommodations seeded.");

  // 3. Create Amenities
  const eventHall = await prisma.amenity.create({
    data: {
      name: "Ocean Breeze Event & Function Hall",
      category: "EVENT_HALL",
      price: 15000,
      unit: "PER_DAY",
      description: "Air-conditioned pavilion accommodating up to 120 guests with state-of-the-art audiovisual system.",
      imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    },
  });

  const poolPass = await prisma.amenity.create({
    data: {
      name: "Infinity Pool & Jacuzzi Pass",
      category: "POOL_PASS",
      price: 350,
      unit: "PER_PERSON",
      description: "Full-day access to our heated infinity pools, kiddie splash zones, and jacuzzi lounges.",
      imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80",
    },
  });

  const foodPackage = await prisma.amenity.create({
    data: {
      name: "Island Gourmet Buffet Package",
      category: "FOOD_PACKAGE",
      price: 750,
      unit: "PER_PERSON",
      description: "All-you-can-eat breakfast and seafood dinner buffet featuring authentic local dishes and BBQ grills.",
      imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    },
  });

  console.log("Amenities seeded.");

  // 4. Create a Sample Reservation
  // Reservation dates are calendar dates: keep them at local midnight so the
  // availability overlap test compares days rather than wall-clock times.
  const midnight = (offsetDays: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    return d;
  };

  const checkIn = midnight(5);
  const checkOut = midnight(7);

  const reservation = await prisma.reservation.create({
    data: {
      bookingCode: "RES-2026-8941",
      userId: guest.id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestCount: 2,
      totalAmount: 11100, // (4800 * 2 nights) + (750 * 2 people buffet)
      status: "CONFIRMED",
      notes: "Anniversary celebration; requested high floor.",
      items: {
        create: [
          {
            accommodationId: suite.id,
            quantity: 2, // 2 nights
            subtotal: 9600,
          },
          {
            amenityId: foodPackage.id,
            quantity: 2,
            subtotal: 1500,
          },
        ],
      },
      payment: {
        create: {
          method: "GCASH",
          status: "PAID",
          referenceNumber: "GCASH-992817263",
          amount: 11100,
          paidAt: new Date(),
        },
      },
    },
  });

  console.log(`Sample reservation created: ${reservation.bookingCode}`);

  // 5. Additional sample stays so the dashboard KPIs, occupancy band, and
  //    calendar have meaningful data on a fresh seed.
  const extraGuest = await prisma.user.create({
    data: {
      email: "maria@example.com",
      name: "Maria Santos",
      password: guestPassword,
      role: "GUEST",
      phone: "+63 917 111 2222",
    },
  });

  const shift = (days: number) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
  };

  const sampleStays = [
    {
      bookingCode: "RES-2026-4183",
      userId: extraGuest.id,
      checkInDate: shift(1),
      checkOutDate: shift(4),
      guestCount: 6,
      status: "PENDING",
      notes: "Corporate team outing — awaiting down payment.",
      items: [
        { accommodationId: villa.id, quantity: 3, subtotal: 8500 * 3 },
        { amenityId: poolPass.id, quantity: 6, subtotal: 350 * 6 },
      ],
      payment: {
        method: "CASH_ON_ARRIVAL",
        status: "PENDING",
        amount: 8500 * 3 + 350 * 6,
        paidAt: null,
        referenceNumber: null,
      },
    },
    {
      bookingCode: "RES-2026-7305",
      userId: guest.id,
      checkInDate: shift(12),
      checkOutDate: shift(16),
      guestCount: 4,
      status: "CONFIRMED",
      notes: "Kids' birthday party; needs the function hall for one day.",
      items: [
        { accommodationId: familyRoom.id, quantity: 4, subtotal: 5200 * 4 },
        { amenityId: eventHall.id, quantity: 1, subtotal: 15000 },
        { amenityId: foodPackage.id, quantity: 4, subtotal: 750 * 4 },
      ],
      payment: {
        method: "CREDIT_CARD",
        status: "PAID",
        amount: 5200 * 4 + 15000 + 750 * 4,
        paidAt: new Date(),
        referenceNumber: "CREDIT_CARD-55210984",
      },
    },
    {
      bookingCode: "RES-2026-2264",
      userId: extraGuest.id,
      checkInDate: shift(-14),
      checkOutDate: shift(-11),
      guestCount: 3,
      status: "COMPLETED",
      notes: null,
      items: [{ accommodationId: cottage.id, quantity: 3, subtotal: 3500 * 3 }],
      payment: {
        method: "GCASH",
        status: "PAID",
        amount: 3500 * 3,
        paidAt: shift(-14),
        referenceNumber: "GCASH-30491772",
      },
    },
    {
      bookingCode: "RES-2026-9052",
      userId: extraGuest.id,
      checkInDate: shift(20),
      checkOutDate: shift(23),
      guestCount: 4,
      status: "CANCELLED",
      notes: "Guest rebooked for a later date.",
      items: [{ accommodationId: villa.id, quantity: 3, subtotal: 8500 * 3 }],
      payment: {
        method: "GCASH",
        // Cancelled stays are refunded, so they never count as revenue.
        status: "REFUNDED",
        amount: 8500 * 3,
        paidAt: null,
        referenceNumber: "GCASH-77182045",
      },
    },
  ];

  for (const stay of sampleStays) {
    await prisma.reservation.create({
      data: {
        bookingCode: stay.bookingCode,
        userId: stay.userId,
        checkInDate: stay.checkInDate,
        checkOutDate: stay.checkOutDate,
        guestCount: stay.guestCount,
        totalAmount: stay.payment.amount,
        status: stay.status,
        notes: stay.notes,
        items: { create: stay.items },
        payment: { create: stay.payment },
      },
    });
  }

  console.log(`Seeded ${sampleStays.length} additional sample stays.`);
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
