import { requireAdmin } from "@/lib/auth";
import { getAccommodations } from "@/actions/admin";
import AccommodationsClient from "./AccommodationsClient";

export const dynamic = "force-dynamic";


export default async function AdminAccommodationsPage() {
  await requireAdmin();

  const accommodations = await getAccommodations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Accommodations Inventory
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Manage villas, cottages, and suites available for guest booking.
        </p>
      </div>

      <AccommodationsClient initialAccommodations={accommodations} />
    </div>
  );
}
