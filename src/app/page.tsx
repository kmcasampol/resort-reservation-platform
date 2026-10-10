import { prisma } from "@/lib/prisma";
import LandingClient from "./LandingClient";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Server Component fetching initial data and current user session directly from database
export default async function HomePage() {
  const [accommodations, amenities, currentUser] = await Promise.all([
    prisma.accommodation.findMany({
      orderBy: { pricePerNight: "asc" },
    }),
    prisma.amenity.findMany({
      orderBy: { price: "asc" },
    }),
    getCurrentUser(),
  ]);

  return (
    <LandingClient
      initialAccommodations={accommodations}
      initialAmenities={amenities}
      initialUser={currentUser}
    />
  );
}
