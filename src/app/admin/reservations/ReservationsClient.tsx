"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Search,
  CheckCircle2,
  Clock,
  Ban,
  ChevronDown,
  ChevronUp,
  Printer,
} from "lucide-react";
import QuickStatusButtons from "../QuickStatusButtons";
import Link from "next/link";
import type { PaymentStatus } from "@/types";

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID: "text-emerald-700",
  PENDING: "text-amber-600",
  FAILED: "text-rose-600",
  REFUNDED: "text-slate-500",
};

function paymentStatusStyle(status: string): string {
  return PAYMENT_STATUS_STYLES[status as PaymentStatus] ?? "text-slate-600";
}

interface ReservationItem {
  id: string;
  bookingCode: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestCount: number;
  totalAmount: number;
  status: string;
  notes?: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
  items: {
    id: string;
    quantity: number;
    subtotal: number;
    accommodation?: { name: string; type: string; pricePerNight: number } | null;
    amenity?: { name: string; category: string; price: number } | null;
  }[];
  payment?: {
    method: string;
    status: string;
    referenceNumber?: string | null;
    amount: number;
  } | null;
}

interface ReservationsClientProps {
  initialReservations: ReservationItem[];
}

export default function ReservationsClient({ initialReservations }: ReservationsClientProps) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = initialReservations.filter((res) => {
    // Tab filter
    if (activeTab !== "ALL" && res.status !== activeTab) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = res.bookingCode.toLowerCase().includes(q);
      const nameMatch = res.user.name.toLowerCase().includes(q);
      const emailMatch = res.user.email.toLowerCase().includes(q);
      return codeMatch || nameMatch || emailMatch;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-teal-100 text-teal-800">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800">
            <Ban className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative grow max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by code, guest name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl overflow-x-auto">
            {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-2xs font-bold rounded-xl transition-all cursor-pointer uppercase ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reservation List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No reservations found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((res) => {
              const isExpanded = expandedId === res.id;
              const accommodationItem = res.items.find((i) => i.accommodation);
              const amenityItems = res.items.filter((i) => i.amenity);

              return (
                <div key={res.id} className="transition-colors hover:bg-slate-50/50">
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Basic info */}
                    <div className="flex items-start sm:items-center gap-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : res.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} details for ${res.bookingCode}`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {res.bookingCode}
                          </span>
                          {getStatusBadge(res.status)}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {res.user.name} • {res.user.email}
                        </p>
                      </div>
                    </div>

                    {/* Stay & Amount info */}
                    <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
                      <div>
                        <span className="text-2xs text-slate-500 block font-bold uppercase">Stay Dates</span>
                        <span>
                          {format(new Date(res.checkInDate), "MMM dd")} -{" "}
                          {format(new Date(res.checkOutDate), "MMM dd, yyyy")}
                        </span>
                      </div>

                      <div>
                        <span className="text-2xs text-slate-500 block font-bold uppercase">Guests</span>
                        <span>{res.guestCount} guests</span>
                      </div>

                      <div>
                        <span className="text-2xs text-slate-500 block font-bold uppercase">Billed</span>
                        <span className="font-bold text-slate-900">
                          ₱{res.totalAmount.toLocaleString()}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <QuickStatusButtons
                        reservationId={res.id}
                        currentStatus={res.status}
                        bookingCode={res.bookingCode}
                      />
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50/80 border-t border-slate-100 text-xs space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200">
                          <span className="text-2xs font-bold uppercase text-slate-500 block mb-2">
                            Accommodations Reserved
                          </span>
                          {accommodationItem?.accommodation ? (
                            <div>
                              <p className="font-bold text-slate-900">
                                {accommodationItem.accommodation.name}
                              </p>
                              <p className="text-2xs text-slate-500">
                                {accommodationItem.accommodation.type} @ ₱
                                {accommodationItem.accommodation.pricePerNight.toLocaleString()} / night
                              </p>
                              <p className="text-2xs text-emerald-700 font-semibold mt-1">
                                Subtotal: ₱{accommodationItem.subtotal.toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-500">None</p>
                          )}
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-slate-200">
                          <span className="text-2xs font-bold uppercase text-slate-500 block mb-2">
                            Add-On Amenities ({amenityItems.length})
                          </span>
                          {amenityItems.length > 0 ? (
                            <ul className="space-y-1">
                              {amenityItems.map((a) => (
                                <li key={a.id} className="text-2xs text-slate-700">
                                  <strong>{a.amenity?.name}</strong> (×{a.quantity}) = ₱
                                  {a.subtotal.toLocaleString()}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-2xs text-slate-500">No add-on amenities</p>
                          )}
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-slate-200">
                          <span className="text-2xs font-bold uppercase text-slate-500 block mb-2">
                            Payment Details
                          </span>
                          {res.payment ? (
                            <div className="space-y-1 text-2xs">
                              <p>Method: <strong>{res.payment.method}</strong></p>
                              <p>
                                Status:{" "}
                                <strong className={paymentStatusStyle(res.payment.status)}>
                                  {res.payment.status}
                                </strong>
                              </p>
                              {res.payment.referenceNumber && (
                                <p className="font-mono text-slate-500">
                                  Ref: {res.payment.referenceNumber}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-500">No payment record</p>
                          )}
                        </div>
                      </div>

                      {res.notes && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-2xs">
                          <strong>Guest Special Request / Note:</strong> {res.notes}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Link
                          href={`/receipt/${res.bookingCode}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-700 hover:border-emerald-200 text-2xs font-bold transition-colors"
                        >
                          <Printer className="w-3 h-3" /> Open Printable Receipt
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
