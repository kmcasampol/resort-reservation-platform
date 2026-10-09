"use client";

import Image from "next/image";
import { AmenityData } from "@/types";
import { Utensils, Waves, Building2, Compass, CheckCircle2 } from "lucide-react";

interface AmenitiesShowcaseProps {
  amenities: AmenityData[];
}

export default function AmenitiesShowcase({ amenities }: AmenitiesShowcaseProps) {
  const getIcon = (category: string) => {
    switch (category) {
      case "EVENT_HALL":
        return <Building2 className="w-5 h-5 text-amber-600" />;
      case "POOL_PASS":
        return <Waves className="w-5 h-5 text-cyan-600" />;
      case "FOOD_PACKAGE":
        return <Utensils className="w-5 h-5 text-emerald-600" />;
      default:
        return <Compass className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getFormatUnit = (unit: string) => {
    switch (unit) {
      case "PER_PERSON":
        return "per guest";
      case "PER_DAY":
        return "per day";
      case "PER_HOUR":
        return "per hour";
      default:
        return unit.toLowerCase().replace("_", " ");
    }
  };

  return (
    <section id="amenities" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Resort Facilities & Add-Ons
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Elevate Your Vacation Experience
          </h2>
          <p className="text-slate-600 text-sm">
            Customize your stay with private pavilions, chef-curated dining packages, and recreational passes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {amenities.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl p-6 bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {item.imageUrl && (
                  <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    {getIcon(item.category)}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200/60">
                    {item.category.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-2xs uppercase tracking-wider text-slate-500 font-bold block">
                    Add-On Price
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">
                      ₱{item.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500">
                      / {getFormatUnit(item.unit)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Available on Checkout</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
