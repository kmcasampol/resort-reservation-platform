"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react";
import { getCalendarData } from "@/actions/admin";

type Unit = {
  id: string;
  name: string;
  type: string;
  status: string;
  pricePerNight: number;
};

type Stay = {
  id: string;
  bookingCode: string;
  status: string;
  /** Prisma `DateTime` fields cross the Server-Action boundary as `Date`, but a
   *  JSON-based fetch would give strings — accept both. */
  checkInDate: Date | string;
  checkOutDate: Date | string;
  guestCount: number;
  user: { name: string };
  items: {
    accommodationId: string | null;
    accommodation: { name: string } | null;
  }[];
};

type CalendarData = { accommodations: Unit[]; reservations: Stay[] };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shortLabel(name: string): string {
  return name.length > 16 ? `${name.slice(0, 15)}…` : name;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Calendar-day normalisation: reservation dates are date-only, so compare the
 *  local midnight of each day rather than the stored wall-clock timestamp. */
function toDay(value: Date | string): Date {
  return startOfDay(toDate(value));
}

function toDayKey(date: Date | string): string {
  return format(toDate(date), "yyyy-MM-dd");
}

export default function CalendarClient({ initialData }: { initialData: CalendarData }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [data, setData] = useState<CalendarData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const monthKey = toDayKey(month);

  useEffect(() => {
    const start = startOfMonth(month);
    const end = addDays(endOfMonth(month), 1);
    let cancelled = false;

    startTransition(async () => {
      try {
        const result = await getCalendarData(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load this month.");
        }
      }
    });

    return () => {
      cancelled = true;
    };
    // monthKey captures the month identity without re-running on identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
    [month]
  );
  const leadingBlanks = getDay(startOfMonth(month));

  /** Reservations that occupy a unit on a given calendar day. */
  const staysByDay = useMemo(() => {
    const map = new Map<string, Stay[]>();
    for (const stay of data.reservations) {
      const from = toDay(stay.checkInDate);
      const to = toDay(stay.checkOutDate);
      for (const day of days) {
        if (day >= from && day < to) {
          const key = toDayKey(day);
          const list = map.get(key) ?? [];
          list.push(stay);
          map.set(key, list);
        }
      }
    }
    return map;
  }, [data.reservations, days]);

  const occupancyByUnit = useMemo(() => {
    const totals = new Map<string, number>();
    for (const stay of data.reservations) {
      const from = toDay(stay.checkInDate);
      const to = toDay(stay.checkOutDate);
      let nights = 0;
      for (const day of days) {
        if (day >= from && day < to) nights++;
      }
      if (nights === 0) continue;
      for (const unit of stay.items) {
        if (!unit.accommodationId) continue;
        totals.set(unit.accommodationId, (totals.get(unit.accommodationId) ?? 0) + nights);
      }
    }
    return totals;
  }, [data.reservations, days]);

  const totalBookedNights = [...occupancyByUnit.values()].reduce((a, b) => a + b, 0);
  const totalCapacity = data.accommodations.length * days.length;
  const occupancyRate =
    totalCapacity > 0 ? Math.round((totalBookedNights / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header / month navigation */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{format(month, "MMMM yyyy")}</h2>
              <p className="text-2xs text-slate-500">
                {occupancyRate}% occupancy · {totalBookedNights} of {totalCapacity} unit-nights
                booked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              disabled={isPending}
              aria-label="Previous month"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMonth(() => startOfMonth(new Date()))}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              disabled={isPending}
              aria-label="Next month"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {isPending && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-2xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300" /> Unit in maintenance
          </span>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Month grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-2xs font-bold uppercase tracking-wider text-slate-500 text-center"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div
              key={`blank-${i}`}
              className="min-h-[92px] border-r border-b border-slate-100 bg-slate-50/40"
            />
          ))}

          {days.map((day) => {
            const key = toDayKey(day);
            const stays = staysByDay.get(key) ?? [];
            const bookings = stays
              .flatMap((stay) =>
                stay.items
                  .filter((item) => item.accommodationId)
                  .map((item) => ({
                    key: `${stay.id}-${item.accommodationId}`,
                    unitName: item.accommodation?.name ?? "Unit",
                    unitId: item.accommodationId as string,
                    status: stay.status,
                    code: stay.bookingCode,
                    guest: stay.user.name,
                  }))
              )
              .filter((booking, index, all) =>
                all.findIndex((other) => other.unitId === booking.unitId && other.code === booking.code) === index
              );

            return (
              <div
                key={key}
                className={`min-h-[92px] p-1.5 border-r border-b border-slate-100 align-top ${
                  isToday(day) ? "bg-emerald-50/60" : ""
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-2xs font-bold ${
                    isToday(day) ? "bg-emerald-700 text-white" : "text-slate-500"
                  }`}
                >
                  {format(day, "d")}
                </span>

                <div className="mt-1 space-y-1">
                  {bookings.map((booking) => (
                    <div
                      key={booking.key}
                      title={`${booking.code} · ${booking.guest} · ${booking.status}`}
                      className={`truncate px-1.5 py-1 rounded-md text-2xs font-semibold leading-tight ${
                        booking.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {shortLabel(booking.unitName)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-unit utilization */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Unit Utilization — {format(month, "MMMM yyyy")}</h3>
          <p className="text-2xs text-slate-500">
            Booked nights per unit across the {days.length} days in this month.
          </p>
        </div>

        {data.accommodations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No accommodations found. Add a unit first.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.accommodations.map((unit) => {
              const booked = occupancyByUnit.get(unit.id) ?? 0;
              const pct = days.length > 0 ? Math.round((booked / days.length) * 100) : 0;
              const isDown = unit.status !== "AVAILABLE";

              return (
                <div key={unit.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="min-w-0 grow">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">{unit.name}</span>
                      <span className="text-2xs uppercase tracking-wider text-slate-500 shrink-0">
                        {unit.type}
                      </span>
                      {isDown && (
                        <span className="text-2xs font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          Maintenance
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDown ? "bg-slate-400" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-600 shrink-0 tabular-nums w-24 text-right">
                    {booked} / {days.length} nights
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
