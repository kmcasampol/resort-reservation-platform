"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AccommodationData } from "@/types";
import { Users, Check, ArrowRight, SlidersHorizontal, RotateCcw } from "lucide-react";

interface AccommodationCatalogProps {
  accommodations: AccommodationData[];
  /** Controlled by the landing page so the Hero search and these tabs agree. */
  selectedTypeFilter: string;
  onTypeFilterChange: (type: string) => void;
  /** Controlled party size — also shared with the Hero search form. */
  guests: number;
  onGuestsChange: (guests: number) => void;
  onSelectAccommodation: (accommodation: AccommodationData) => void;
}

const TYPE_TABS = [
  { id: "ALL", label: "All Accommodations" },
  { id: "VILLA", label: "Villas" },
  { id: "COTTAGE", label: "Cottages" },
  { id: "ROOM", label: "Ocean Suites" },
];

const ANY = 0;

export default function AccommodationCatalog({
  accommodations,
  selectedTypeFilter,
  onTypeFilterChange,
  guests,
  onGuestsChange,
  onSelectAccommodation,
}: AccommodationCatalogProps) {
  // Local UI-only filter: nightly rate ceiling.
  const [maxPrice, setMaxPrice] = useState<number>(ANY);

  const priceOptions = useMemo(() => {
    const unique = [...new Set(accommodations.map((a) => a.pricePerNight))].sort((a, b) => a - b);
    return unique;
  }, [accommodations]);

  const maxCapacity = useMemo(
    () => accommodations.reduce((max, a) => Math.max(max, a.capacity), 1),
    [accommodations]
  );

  const partyOptions = useMemo(() => {
    const sizes = Array.from({ length: maxCapacity }, (_, i) => i + 1);
    // Keep the select truthful even when the Hero picked a party larger than
    // anything we sleep — the result should be an empty list, not a blank box.
    if (guests > maxCapacity) sizes.push(guests);
    return sizes;
  }, [maxCapacity, guests]);

  const filtered = useMemo(
    () =>
      accommodations.filter((item) => {
        if (selectedTypeFilter !== "ALL" && item.type !== selectedTypeFilter) return false;
        if (guests > 0 && item.capacity < guests) return false;
        if (maxPrice > 0 && item.pricePerNight > maxPrice) return false;
        return true;
      }),
    [accommodations, selectedTypeFilter, guests, maxPrice]
  );

  const hasActiveFilters = selectedTypeFilter !== "ALL" || guests > 0 || maxPrice > 0;

  const clearFilters = () => {
    onTypeFilterChange("ALL");
    onGuestsChange(0);
    setMaxPrice(ANY);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "VILLA":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "COTTAGE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-sky-100 text-sky-800 border-sky-200";
    }
  };

  return (
    <section id="accommodations" className="py-16 bg-slate-50/70 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Curated Accommodations
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Choose Your Perfect Island Sanctuary
            </h2>
            <p className="text-slate-600 text-sm max-w-xl">
              Each villa and cottage is nestled in tropical flora with custom amenities, premium linens, and private veranda views.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-x-auto">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTypeFilterChange(tab.id)}
                aria-pressed={selectedTypeFilter === tab.id}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  selectedTypeFilter === tab.id
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Capacity + price filters (spec §4.1 #1) */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            Refine
          </div>

          <div className="grow grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-2xs font-bold text-slate-500 uppercase block mb-1">
                Party size
              </span>
              <select
                value={guests}
                onChange={(e) => onGuestsChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={ANY}>Any party size</option>
                {partyOptions.map((size) => (
                  <option key={size} value={size}>
                    Sleeps {size} {size === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-2xs font-bold text-slate-500 uppercase block mb-1">
                Max nightly rate
              </span>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={ANY}>Any price</option>
                {priceOptions.map((price) => (
                  <option key={price} value={price}>
                    Up to ₱{price.toLocaleString()} / night
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span className="text-xs font-semibold text-slate-500">
              {filtered.length} of {accommodations.length} units
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-2xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Grid of Accommodations */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
            <p className="text-slate-500 font-medium text-sm">
              No accommodations match the selected type, party size, and budget.
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md shadow-slate-200/40 hover:shadow-xl hover:shadow-emerald-950/10 hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span
                        className={`text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-2xs ${getBadgeColor(
                          item.type
                        )}`}
                      >
                        {item.type}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-2xs border border-white/80">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Up to {item.capacity} Guests</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Free High-Speed WiFi
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Air Conditioned
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-6 pt-0 mt-2">
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-2xs uppercase tracking-wider text-slate-500 block font-bold">
                        Nightly Rate
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900">
                          ₱{item.pricePerNight.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">/ night</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectAccommodation(item)}
                      disabled={item.status !== "AVAILABLE"}
                      className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-xs cursor-pointer ${
                        item.status === "AVAILABLE"
                          ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <span>{item.status === "AVAILABLE" ? "Reserve Unit" : "Maintenance"}</span>
                      {item.status === "AVAILABLE" && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
