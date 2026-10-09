"use client";

import { useState } from "react";
import { Calendar, Users, MapPin, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { format, addDays } from "date-fns";

interface HeroProps {
  onSearch: (params: { checkIn: string; checkOut: string; guests: number; type: string }) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const tomorrow = addDays(new Date(), 1);
  const nextDay = addDays(new Date(), 3);

  const [checkIn, setCheckIn] = useState(format(tomorrow, "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(format(nextDay, "yyyy-MM-dd"));
  const [guests, setGuests] = useState(2);
  const [type, setType] = useState("ALL");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ checkIn, checkOut, guests, type });
    const target = document.getElementById("accommodations");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-20 lg:pt-16 lg:pb-28">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
        <div className="absolute top-60 -left-20 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exclusive Island Escape & Natural Serenity</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Experience Pure Sanctuary at{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
              Solara Azure
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
            Reserve handcrafted private villas, beachfront bamboo cottages, and executive oceanfront suites. Instant confirmation, transparent pricing, and zero hassle.
          </p>
        </div>

        {/* Quick Booking Search Card */}
        <div className="mt-12 max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Check-In */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hero-checkin"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Check-In
                </label>
                <input
                  id="hero-checkin"
                  type="date"
                  value={checkIn}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 text-sm bg-slate-50/50"
                  required
                />
              </div>

              {/* Check-Out */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hero-checkout"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Check-Out
                </label>
                <input
                  id="hero-checkout"
                  type="date"
                  value={checkOut}
                  min={checkIn || format(tomorrow, "yyyy-MM-dd")}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 text-sm bg-slate-50/50"
                  required
                />
              </div>

              {/* Guests */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hero-guests"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-600" /> Guests
                </label>
                <select
                  id="hero-guests"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 text-sm bg-slate-50/50 cursor-pointer"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests (Couple)</option>
                  <option value={4}>4 Guests (Family)</option>
                  <option value={6}>6 Guests (Group)</option>
                  <option value={8}>8+ Guests (Large Villa)</option>
                </select>
              </div>

              {/* Accommodation Type */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hero-type"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Accommodation
                </label>
                <select
                  id="hero-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 text-sm bg-slate-50/50 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="VILLA">Private Villas</option>
                  <option value="COTTAGE">Bamboo Cottages</option>
                  <option value="ROOM">Ocean Suites & Rooms</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Instant SQLite Confirmation
                </span>
                <span>•</span>
                <span>Mock GCash / Card Accepted</span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-700/25 hover:from-emerald-800 hover:to-teal-800 transition-all cursor-pointer"
              >
                <span>Find Available Stays</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
