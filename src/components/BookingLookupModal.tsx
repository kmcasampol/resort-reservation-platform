"use client";

import { useState, useTransition } from "react";
import { getBookingByCode, cancelGuestBooking } from "@/actions/booking";
import { BookingDetail } from "@/types";
import {
  X,
  Search,
  Printer,
  AlertCircle,
  Loader2,
  Trash2,
  CheckCircle,
  Clock,
  Ban,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface BookingLookupModalProps {
  onClose: () => void;
}

export default function BookingLookupModal({ onClose }: BookingLookupModalProps) {
  const [isPending, startTransition] = useTransition();
  const [bookingCode, setBookingCode] = useState("");
  const [result, setResult] = useState<BookingDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cancellation state
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelEmail, setCancelEmail] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim()) return;

    setErrorMsg(null);
    setShowCancelPrompt(false);
    setCancelSuccess(false);

    startTransition(async () => {
      const data = await getBookingByCode(bookingCode);
      setResult(data);
      if (!data) {
        setErrorMsg("No reservation found matching this booking code.");
      }
    });
  };

  const handleCancelBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !cancelEmail) return;

    startTransition(async () => {
      const res = await cancelGuestBooking(result.bookingCode, cancelEmail);
      if (res.success) {
        setCancelSuccess(true);
        setShowCancelPrompt(false);
        // Refresh data
        const updated = await getBookingByCode(result.bookingCode);
        setResult(updated);
      } else {
        setErrorMsg(res.error || "Failed to cancel booking.");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Confirmation
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Ban className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-emerald-100 my-8 overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div>
            <span className="text-2xs uppercase tracking-widest text-emerald-300 font-bold block">
              Guest Portal
            </span>
            <h3 className="text-lg font-bold">Find Your Reservation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Enter Booking Reference Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. RES-2026-8941"
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                className="grow px-4 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 uppercase"
                required
              />
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cancelSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Your reservation has been cancelled.</span>
            </div>
          )}

          {/* Results display */}
          {result && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-2xs text-slate-400 font-bold uppercase block">Booking Code</span>
                  <span className="font-mono font-extrabold text-slate-900 text-lg">
                    {result.bookingCode}
                  </span>
                </div>
                <div>{getStatusBadge(result.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Guest Name</span>
                  <span className="text-slate-800 font-bold">{result.user.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Contact Email</span>
                  <span className="text-slate-800 font-bold">{result.user.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Check-In</span>
                  <span className="text-slate-800 font-bold">
                    {format(new Date(result.checkInDate), "MMM dd, yyyy")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Check-Out</span>
                  <span className="text-slate-800 font-bold">
                    {format(new Date(result.checkOutDate), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold block">
                  Reserved Items
                </span>
                {result.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-700">
                    <span>
                      {item.accommodation?.name || item.amenity?.name} (×{item.quantity})
                    </span>
                    <span className="font-semibold">₱{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}

                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-emerald-700">₱{result.totalAmount.toLocaleString()}</span>
                </div>

                {result.payment && (
                  <div className="text-2xs text-slate-500 pt-1">
                    Payment: <strong>{result.payment.method}</strong> ({result.payment.status})
                    {result.payment.referenceNumber && (
                      <span className="ml-2 font-mono">Ref: {result.payment.referenceNumber}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <Link
                  href={`/receipt/${result.bookingCode}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Printable Receipt
                </Link>

                {result.status !== "CANCELLED" && result.status !== "COMPLETED" && (
                  <button
                    type="button"
                    onClick={() => setShowCancelPrompt(!showCancelPrompt)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel Reservation
                  </button>
                )}
              </div>

              {/* Cancel Prompt */}
              {showCancelPrompt && (
                <form
                  onSubmit={handleCancelBooking}
                  className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 text-xs"
                >
                  <p className="text-rose-900 font-semibold">
                    To cancel, enter the guest email address used for this reservation:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={cancelEmail}
                      placeholder="Enter guest email"
                      onChange={(e) => setCancelEmail(e.target.value)}
                      className="grow px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Confirm Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
