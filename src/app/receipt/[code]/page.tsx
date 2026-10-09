import { getBookingByCode } from "@/actions/booking";
import { notFound } from "next/navigation";
import { Palmtree, ArrowLeft, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import PrintButton from "@/components/PrintButton";
import type { PaymentStatus } from "@/types";

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PAID: "text-emerald-700",
  PENDING: "text-amber-600",
  FAILED: "text-rose-600",
  REFUNDED: "text-slate-500",
};

export const dynamic = "force-dynamic";


interface ReceiptPageProps {
  params: Promise<{ code: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { code } = await params;
  const booking = await getBookingByCode(code);

  if (!booking) {
    notFound();
  }

  const nights = differenceInCalendarDays(
    new Date(booking.checkOutDate),
    new Date(booking.checkInDate)
  );

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 print:p-0 print:bg-white text-slate-800">
      {/* Action Header (Hidden in Print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Solara Azure
        </Link>

        <PrintButton label="Print or Save as PDF" />
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 border border-slate-200 print:shadow-none print:border-none print:p-6 print:rounded-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
              <Palmtree className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Solara Azure Resort</h1>
              <p className="text-xs text-slate-500">Official Guest Reservation Receipt</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xs font-bold uppercase tracking-widest text-slate-500 block">
              Booking Reference
            </span>
            <span className="text-2xl font-black font-mono text-emerald-800 block">
              {booking.bookingCode}
            </span>
            <span className="text-2xs text-slate-500">
              Issued: {format(new Date(booking.createdAt), "MMM dd, yyyy • hh:mm a")}
            </span>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {booking.status === "CONFIRMED" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : booking.status === "CANCELLED" ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Reservation Status: {booking.status}
              </span>
              <p className="text-2xs text-emerald-800">
                {booking.status === "CANCELLED"
                  ? "This reservation has been cancelled."
                  : booking.payment?.status === "PAID"
                    ? `Payment received via ${booking.payment.method} (Ref: ${booking.payment.referenceNumber || "N/A"})`
                    : booking.payment?.status === "REFUNDED"
                      ? "Payment for this reservation has been refunded."
                      : `Payment pending upon arrival at resort reception.`}
              </p>
            </div>
          </div>
        </div>

        {/* Guest & Schedule Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
          <div className="space-y-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">
              Guest Information
            </span>
            <p className="text-sm font-bold text-slate-900">{booking.user.name}</p>
            <p className="text-slate-600">Email: {booking.user.email}</p>
            <p className="text-slate-600">Phone: {booking.user.phone || "N/A"}</p>
            <p className="text-slate-600">Total Party: {booking.guestCount} Guests</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">
              Stay Itinerary
            </span>
            <p className="text-slate-700">
              <strong>Check-In:</strong> {format(new Date(booking.checkInDate), "EEEE, MMMM dd, yyyy")}
            </p>
            <p className="text-slate-700">
              <strong>Check-Out:</strong> {format(new Date(booking.checkOutDate), "EEEE, MMMM dd, yyyy")}
            </p>
            <p className="text-slate-700">
              <strong>Duration:</strong> {nights} {nights === 1 ? "Night" : "Nights"}
            </p>
            {booking.notes && (
              <p className="text-slate-500 text-2xs italic pt-1">
                <strong>Notes:</strong> {booking.notes}
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6 border-b border-slate-200">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
            Itemized Breakdown
          </span>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-2xs">
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5 text-center">Qty / Nights</th>
                <th className="py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {booking.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-semibold text-slate-900">
                    {item.accommodation?.name || item.amenity?.name}
                    {item.accommodation && (
                      <span className="block text-2xs font-normal text-slate-500">
                        {item.accommodation.type} @ ₱{item.accommodation.pricePerNight.toLocaleString()} / night
                      </span>
                    )}
                    {item.amenity && (
                      <span className="block text-2xs font-normal text-slate-500">
                        Resort Add-On ({item.amenity.category.replace("_", " ")})
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    ₱{item.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total & Policies */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="text-2xs text-slate-500 max-w-sm space-y-1">
            <span className="font-bold text-slate-600 block">Resort Check-In Policy:</span>
            <p>Check-in time starts at 2:00 PM. Check-out time is strictly at 11:00 AM.</p>
            <p>Please present a valid government-issued ID alongside this digital receipt upon arrival.</p>
          </div>

          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Payment Method</span>
              <span className="font-bold text-slate-700">{booking.payment?.method || "N/A"}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Payment Status</span>
              <span
                className={`font-bold ${
                  PAYMENT_STATUS_STYLES[(booking.payment?.status as PaymentStatus) || "PENDING"]
                }`}
              >
                {booking.payment?.status || "PENDING"}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-extrabold text-slate-900">Total Billed</span>
              <span className="text-xl font-black text-emerald-800">
                ₱{booking.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
