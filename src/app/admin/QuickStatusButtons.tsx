"use client";

import { useTransition } from "react";
import { updateReservationStatus } from "@/actions/admin";
import { Check, X, Printer, Loader2 } from "lucide-react";
import Link from "next/link";

interface QuickStatusButtonsProps {
  reservationId: string;
  currentStatus: string;
  bookingCode: string;
}

export default function QuickStatusButtons({
  reservationId,
  currentStatus,
  bookingCode,
}: QuickStatusButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (status: string) => {
    startTransition(async () => {
      await updateReservationStatus(reservationId, status);
    });
  };

  return (
    <div className="inline-flex items-center gap-1.5 justify-end">
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : (
        <>
          {currentStatus === "PENDING" && (
            <button
              onClick={() => handleUpdate("CONFIRMED")}
              title="Confirm Reservation"
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {currentStatus === "CONFIRMED" && (
            <button
              onClick={() => handleUpdate("COMPLETED")}
              title="Mark Completed / Checked Out"
              className="px-2 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-2xs font-bold transition-colors cursor-pointer"
            >
              Check Out
            </button>
          )}

          {currentStatus !== "CANCELLED" && currentStatus !== "COMPLETED" && (
            <button
              onClick={() => handleUpdate("CANCELLED")}
              title="Cancel Booking"
              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            href={`/receipt/${bookingCode}`}
            target="_blank"
            title="View Receipt"
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}
