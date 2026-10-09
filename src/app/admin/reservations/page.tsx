import { requireAdmin } from "@/lib/auth";
import { getAdminReservations } from "@/actions/admin";
import ReservationsClient from "./ReservationsClient";

export const dynamic = "force-dynamic";


export default async function AdminReservationsPage() {
  await requireAdmin();

  const reservations = await getAdminReservations("ALL");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Reservation Management
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Review, approve, complete, or cancel guest bookings stored in SQLite.
        </p>
      </div>

      <ReservationsClient initialReservations={reservations} />
    </div>
  );
}
