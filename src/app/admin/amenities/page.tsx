import { requireAdmin } from "@/lib/auth";
import { getAmenities } from "@/actions/admin";
import AmenitiesClient from "./AmenitiesClient";

export const dynamic = "force-dynamic";


export default async function AdminAmenitiesPage() {
  await requireAdmin();

  const amenities = await getAmenities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Resort Amenities & Activities
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Manage event halls, pool passes, food buffet packages, and island adventures.
        </p>
      </div>

      <AmenitiesClient initialAmenities={amenities} />
    </div>
  );
}
