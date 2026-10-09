"use client";

import { useState, useTransition, useMemo } from "react";
import { AccommodationData, AmenityData, PaymentMethod } from "@/types";
import { createBooking } from "@/actions/booking";
import {
  X,
  Calendar,
  Users,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Loader2,
  Printer,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { differenceInCalendarDays, parseISO, format } from "date-fns";
import Link from "next/link";

interface BookingModalProps {
  accommodation: AccommodationData;
  amenities: AmenityData[];
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
  onClose: () => void;
}

export default function BookingModal({
  accommodation,
  amenities,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  onClose,
}: BookingModalProps) {
  const [isPending, startTransition] = useTransition();

  // Booking Form State
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guestCount, setGuestCount] = useState(
    Math.min(initialGuests || 2, accommodation.capacity)
  );

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Amenities selected: Map of amenityId -> quantity
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, number>>({});

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("GCASH");

  // Submission Result
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string | null>(null);

  // Calculations
  const nights = useMemo(() => {
    try {
      const start = parseISO(checkIn);
      const end = parseISO(checkOut);
      const diff = differenceInCalendarDays(end, start);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  }, [checkIn, checkOut]);

  const accommodationTotal = useMemo(() => {
    return accommodation.pricePerNight * nights;
  }, [accommodation.pricePerNight, nights]);

  const amenitiesTotal = useMemo(() => {
    let sum = 0;
    for (const [id, qty] of Object.entries(selectedAmenities)) {
      if (qty > 0) {
        const item = amenities.find((a) => a.id === id);
        if (item) {
          sum += item.price * qty;
        }
      }
    }
    return sum;
  }, [selectedAmenities, amenities]);

  const grandTotal = accommodationTotal + amenitiesTotal;

  const handleToggleAmenity = (amenityId: string, checked: boolean) => {
    setSelectedAmenities((prev) => {
      const copy = { ...prev };
      if (checked) {
        copy[amenityId] = guestCount; // default quantity to guest count or 1
      } else {
        delete copy[amenityId];
      }
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (nights < 1) {
      setErrorMsg("Check-out date must be at least 1 day after check-in.");
      return;
    }

    if (!guestName || !guestEmail || !guestPhone) {
      setErrorMsg("Please fill in all required guest information.");
      return;
    }

    const payloadAmenities = Object.entries(selectedAmenities)
      .filter(([, qty]) => qty > 0)
      .map(([amenityId, quantity]) => ({
        amenityId,
        quantity,
      }));

    startTransition(async () => {
      const res = await createBooking({
        accommodationId: accommodation.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestCount,
        guestName,
        guestEmail,
        guestPhone,
        notes,
        selectedAmenities: payloadAmenities,
        paymentMethod,
        // Reference numbers are minted server-side for the simulated GCash /
        // card checkout — there is no real gateway to supply one.
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to finalize reservation.");
      } else if (res.bookingCode) {
        setConfirmedBookingCode(res.bookingCode);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-100 my-8 overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div>
            <span className="text-2xs uppercase tracking-widest text-emerald-300 font-bold block">
              Reservation Checkout
            </span>
            <h3 className="text-lg font-bold">{accommodation.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmed Success State */}
        {confirmedBookingCode ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                Reservation Confirmed!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your reservation at Solara Azure has been logged in SQLite. We have sent a copy of your booking to{" "}
                <span className="font-semibold text-slate-800">{guestEmail}</span>.
              </p>
            </div>

            {/* Reference Card */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 max-w-sm mx-auto">
              <span className="text-2xs uppercase font-bold text-emerald-700 tracking-widest block">
                Your Booking Code
              </span>
              <span className="text-2xl font-extrabold text-emerald-950 tracking-wider font-mono">
                {confirmedBookingCode}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Keep this code to look up or manage your booking anytime.
              </span>
            </div>

            {/* Quick Summary */}
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                <strong>Dates:</strong> {checkIn} to {checkOut} ({nights} {nights === 1 ? "night" : "nights"})
              </p>
              <p>
                <strong>Total Amount:</strong> ₱{grandTotal.toLocaleString()} ({paymentMethod.replace("_", " ")})
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <Link
                href={`/receipt/${confirmedBookingCode}`}
                target="_blank"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 transition-all"
              >
                <Printer className="w-4 h-4" /> View Printable Receipt
              </Link>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Dates & Capacity */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> 1. Select Dates & Guests
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="booking-checkin"
                    className="text-2xs font-bold text-slate-500 uppercase block mb-1"
                  >
                    Check-In
                  </label>
                  <input
                    id="booking-checkin"
                    type="date"
                    value={checkIn}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="booking-checkout"
                    className="text-2xs font-bold text-slate-500 uppercase block mb-1"
                  >
                    Check-Out
                  </label>
                  <input
                    id="booking-checkout"
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="booking-guests"
                    className="text-2xs font-bold text-slate-500 uppercase block mb-1"
                  >
                    Guests (Max {accommodation.capacity})
                  </label>
                  <input
                    id="booking-guests"
                    type="number"
                    value={guestCount}
                    min={1}
                    max={accommodation.capacity}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {nights > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <span>
                    Length of stay: <strong>{nights} {nights === 1 ? "night" : "nights"}</strong>
                  </span>
                  <span>
                    Base: ₱{accommodation.pricePerNight.toLocaleString()} × {nights} ={" "}
                    <strong>₱{accommodationTotal.toLocaleString()}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Add-On Amenities */}
            {amenities.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 2. Optional Resort Add-Ons
                </h4>

                <div className="space-y-2">
                  {amenities.map((amenity) => {
                    const isChecked = Boolean(selectedAmenities[amenity.id]);
                    return (
                      <div
                        key={amenity.id}
                        className={`p-3 rounded-xl border transition-colors flex items-center justify-between ${
                          isChecked
                            ? "bg-emerald-50/50 border-emerald-300"
                            : "bg-slate-50 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`amenity-${amenity.id}`}
                            checked={isChecked}
                            onChange={(e) => handleToggleAmenity(amenity.id, e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <label
                              htmlFor={`amenity-${amenity.id}`}
                              className="text-xs font-bold text-slate-800 cursor-pointer block"
                            >
                              {amenity.name}
                            </label>
                            <span className="text-2xs text-slate-500">
                              ₱{amenity.price.toLocaleString()} / {amenity.unit.toLowerCase().replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {isChecked && (
                          <div className="flex items-center gap-2">
                            <span className="text-2xs text-slate-500">Qty:</span>
                            <input
                              type="number"
                              aria-label={`Quantity for ${amenity.name}`}
                              min={1}
                              max={30}
                              value={selectedAmenities[amenity.id] || 1}
                              onChange={(e) =>
                                setSelectedAmenities((prev) => ({
                                  ...prev,
                                  [amenity.id]: Math.max(1, Number(e.target.value)),
                                }))
                              }
                              className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Guest Details */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> 3. Guest Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="booking-name"
                    className="text-2xs font-bold text-slate-500 uppercase block mb-1"
                  >
                    Full Name *
                  </label>
                  <input
                    id="booking-name"
                    type="text"
                    value={guestName}
                    placeholder="e.g. Maria Santos"
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="booking-email"
                    className="text-2xs font-bold text-slate-500 uppercase block mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    id="booking-email"
                    type="email"
                    value={guestEmail}
                    placeholder="e.g. maria@gmail.com"
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="booking-phone"
                    className="text-2xs font-bold text-slate-500 uppercase block mb-1"
                  >
                    Contact Phone Number *
                  </label>
                  <input
                    id="booking-phone"
                    type="tel"
                    value={guestPhone}
                    placeholder="e.g. +63 912 345 6789"
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="booking-notes"
                    className="text-2xs font-bold text-slate-500 uppercase block mb-1"
                  >
                    Special Requests / Notes (Optional)
                  </label>
                  <textarea
                    id="booking-notes"
                    rows={2}
                    value={notes}
                    placeholder="e.g. Early check-in request, extra pillows, food allergies"
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Mock Payment Option */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> 4. Mock Payment Method
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "GCASH",
                    label: "GCash",
                    icon: <Smartphone className="w-4 h-4 text-sky-500" />,
                    note: "Instant approval",
                  },
                  {
                    id: "CREDIT_CARD",
                    label: "Card (Mock)",
                    icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
                    note: "Visa / Mastercard",
                  },
                  {
                    id: "CASH_ON_ARRIVAL",
                    label: "Cash on Arrival",
                    icon: <Banknote className="w-4 h-4 text-amber-600" />,
                    note: "Pay at reception",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id as PaymentMethod)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentMethod === opt.id
                        ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                    </div>
                    <span className="text-2xs text-slate-400 block mt-1">{opt.note}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic mock payment hint */}
              {paymentMethod === "GCASH" && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-xs text-sky-900 space-y-1">
                  <span className="font-bold block">Simulated GCash Checkout:</span>
                  <p className="text-2xs text-sky-700">
                    A mock reference code will be generated upon confirmation. No real charge occurs.
                  </p>
                </div>
              )}

              {paymentMethod === "CREDIT_CARD" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                  <span className="font-bold text-xs block">Simulated Card Processing:</span>
                  <input
                    type="text"
                    disabled
                    value="4111 •••• •••• 1111 (Test Card)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-500"
                  />
                </div>
              )}
            </div>

            {/* Price Breakdown Footer */}
            <div className="pt-4 border-t border-slate-200/80 bg-slate-50 -mx-6 -mb-6 p-6 space-y-4">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Accommodation ({nights} nights)</span>
                  <span>₱{accommodationTotal.toLocaleString()}</span>
                </div>
                {amenitiesTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Resort Add-Ons</span>
                    <span>₱{amenitiesTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-emerald-700">₱{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending || nights < 1}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-700/25 hover:from-emerald-800 hover:to-teal-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Reservation...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Reservation (₱{grandTotal.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
