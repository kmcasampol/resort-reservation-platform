import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists — if so, the database is already seeded,
  // so we skip clearing records to protect production data across redeployments!
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("Database already initialized with existing admin. Skipping destructive seed to preserve data.");
    return;
  }

  console.log("Empty database detected. Seeding initial resort data...");

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

  const extraGuest = await prisma.user.create({
    data: {
      email: "maria.clara@example.ph",
      name: "Maria Clara",
      password: guestPassword,
      role: "GUEST",
      phone: "+63 917 555 4321",
    },
  });

  console.log(`Created admin: ${admin.email} and guests: ${guest.email}, ${extraGuest.email}`);

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

  // 4. Create Sample Reservations
  const today = new Date();
  const shift = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(14, 0, 0, 0);
    return d;
  };

  const sampleStays = [
    {
      bookingCode: "RES-2026-8941",
      userId: guest.id,
      checkInDate: shift(5),
      checkOutDate: shift(7),
      guestCount: 2,
      status: "CONFIRMED",
      notes: "Anniversary celebration; requested high floor.",
      items: [
        { accommodationId: suite.id, quantity: 2, subtotal: 4800 * 2 },
        { amenityId: foodPackage.id, quantity: 2, subtotal: 750 * 2 },
      ],
      payment: {
        method: "GCASH",
        status: "PAID",
        amount: 4800 * 2 + 750 * 2,
        paidAt: new Date(),
        referenceNumber: "GCASH-992817263",
      },
    },
    {
      bookingCode: "RES-2026-1102",
      userId: extraGuest.id,
      checkInDate: shift(1),
      checkOutDate: shift(4),
      guestCount: 6,
      status: "CONFIRMED",
      notes: "Family reunion. Please prepare extra beach towels.",
      items: [
        { accommodationId: familyRoom.id, quantity: 3, subtotal: 5200 * 3 },
        { amenityId: poolPass.id, quantity: 6, subtotal: 350 * 6 },
      ],
      payment: {
        method: "CREDIT_CARD",
        status: "PAID",
        amount: 5200 * 3 + 350 * 6,
        paidAt: new Date(),
        referenceNumber: "CARD-48821903",
      },
    },
    {
      bookingCode: "RES-2026-4481",
      userId: guest.id,
      checkInDate: shift(10),
      checkOutDate: shift(12),
      guestCount: 4,
      status: "PENDING",
      notes: "Paying cash upon arrival at resort reception.",
      items: [{ accommodationId: cottage.id, quantity: 2, subtotal: 3500 * 2 }],
      payment: {
        method: "CASH_ON_ARRIVAL",
        status: "PENDING",
        amount: 3500 * 2,
        paidAt: null,
        referenceNumber: null,
      },
    },
    {
      bookingCode: "RES-2026-7230",
      userId: extraGuest.id,
      checkInDate: shift(-10),
      checkOutDate: shift(-7),
      guestCount: 3,
      status: "COMPLETED",
      notes: null,
      items: [{ accommodationId: cottage.id, quantity: 3, subtotal: 3500 * 3 }],
      payment: {
        method: "GCASH",
        status: "PAID",
        amount: 3500 * 3,
        paidAt: shift(-10),
        referenceNumber: "GCASH-30491772",
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

  console.log(`Seeded ${sampleStays.length} initial sample stays.`);
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
