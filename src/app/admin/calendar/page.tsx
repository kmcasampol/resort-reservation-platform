import { requireAdmin } from "@/lib/auth";
import { getCalendarData } from "@/actions/admin";
import { startOfMonth, endOfMonth, addDays, format } from "date-fns";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  await requireAdmin();

  const start = startOfMonth(new Date());
  const end = addDays(endOfMonth(new Date()), 1); // exclusive upper bound

  const initial = await getCalendarData(
    format(start, "yyyy-MM-dd"),
    format(end, "yyyy-MM-dd")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Occupancy Calendar
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Month-by-month view of which units are booked. Reserved nights block inventory for
          Pending and Confirmed stays only.
        </p>
      </div>

      <CalendarClient initialData={initial} />
    </div>
  );
}
