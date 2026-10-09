import { prisma } from "@/lib/prisma";
import LandingClient from "./LandingClient";

export const dynamic = "force-dynamic";

// Server Component fetching initial data directly from SQLite

export default async function HomePage() {
  const [accommodations, amenities] = await Promise.all([
    prisma.accommodation.findMany({
      orderBy: { pricePerNight: "asc" },
    }),
    prisma.amenity.findMany({
      orderBy: { price: "asc" },
    }),
  ]);

  return (
    <LandingClient
      initialAccommodations={accommodations}
      initialAmenities={amenities}
    />
  );
}
