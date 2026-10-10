"use client";

import { useState } from "react";
import { AccommodationData, AmenityData } from "@/types";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AccommodationCatalog from "@/components/AccommodationCatalog";
import AmenitiesShowcase from "@/components/AmenitiesShowcase";
import BookingModal from "@/components/BookingModal";
import BookingLookupModal from "@/components/BookingLookupModal";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";
import { format, addDays } from "date-fns";
import { Sun, ShieldCheck, HeartHandshake } from "lucide-react";
import type { UserSession } from "@/lib/auth";

interface LandingClientProps {
  initialAccommodations: AccommodationData[];
  initialAmenities: AmenityData[];
  initialUser: UserSession | null;
}

export default function LandingClient({
  initialAccommodations,
  initialAmenities,
  initialUser,
}: LandingClientProps) {
  // Search state passed from Hero to Catalog
  const tomorrow = addDays(new Date(), 1);
  const nextDay = addDays(new Date(), 3);

  const [searchParams, setSearchParams] = useState({
    checkIn: format(tomorrow, "yyyy-MM-dd"),
    checkOut: format(nextDay, "yyyy-MM-dd"),
    guests: 2,
    type: "ALL",
  });

  // Catalog filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [guestFilter, setGuestFilter] = useState(2);

  // User session state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(initialUser);

  // Modal states
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationData | null>(null);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleHeroSearch = (params: {
    checkIn: string;
    checkOut: string;
    guests: number;
    type: string;
  }) => {
    setSearchParams(params);
    setTypeFilter(params.type);
    setGuestFilter(params.guests);
  };

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        onOpenLookup={() => setLookupModalOpen(true)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={() => setCurrentUser(null)}
      />

      {/* Main Content */}
      <main className="grow">
        {/* Hero Section */}
        <Hero onSearch={handleHeroSearch} />

        {/* Accommodations Catalog */}
        <AccommodationCatalog
          accommodations={initialAccommodations}
          selectedTypeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          guests={guestFilter}
          onGuestsChange={setGuestFilter}
          onSelectAccommodation={(acc: AccommodationData) => setSelectedAccommodation(acc)}
        />

        {/* Amenities & Add-ons Showcase */}
        <AmenitiesShowcase amenities={initialAmenities} />

        {/* Why Choose Solara Azure */}
        <section id="experiences" className="py-24 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-2xs uppercase tracking-widest text-emerald-400 font-bold block">
                The Coastal Experience
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Crafted for Peace, Elegance, and Adventure
              </h2>
              <p className="text-slate-300 text-sm">
                From private ocean villas to all-inclusive family celebrations, discover why guests return season after season.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sun className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Pristine Shoreline</h3>
                <p className="text-sm text-emerald-100/70 leading-relaxed">
                  Step right onto soft golden sand with reserved loungers, beachside cocktail shacks, and vibrant coral reefs.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Guaranteed Reservation</h3>
                <p className="text-sm text-emerald-100/70 leading-relaxed">
                  Zero double-booking guarantee via our transactional reservation lock. Your room is 100% secured immediately.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 hover:border-emerald-500/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Personalized Concierge</h3>
                <p className="text-sm text-emerald-100/70 leading-relaxed">
                  Enjoy flexible payment options (GCash, Card, or Cash on Arrival) and on-demand function hall and catering coordination.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Booking Checkout Modal */}
      {selectedAccommodation && (
        <BookingModal
          accommodation={selectedAccommodation}
          amenities={initialAmenities}
          initialCheckIn={searchParams.checkIn}
          initialCheckOut={searchParams.checkOut}
          initialGuests={searchParams.guests}
          currentUser={currentUser}
          onClose={() => setSelectedAccommodation(null)}
        />
      )}

      {/* Lookup Reservation Modal */}
      {lookupModalOpen && (
        <BookingLookupModal onClose={() => setLookupModalOpen(false)} />
      )}

      {/* User Login & Register Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}
