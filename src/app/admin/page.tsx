import { requireAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/actions/admin";

export const dynamic = "force-dynamic";

import {
  DollarSign,
  CalendarCheck,
  Clock,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import QuickStatusButtons from "./QuickStatusButtons";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const overview = await getAdminOverview();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Welcome back, <strong className="text-slate-800">{session.name}</strong>. Overview of resort operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/calendar"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Occupancy Calendar
          </Link>
          <Link
            href="/admin/reservations"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Manage Reservations
          </Link>
          <Link
            href="/admin/accommodations"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            + New Unit
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              ₱{overview.totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-700 block mt-1 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Settled SQLite Transactions
            </span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Bookings
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              {overview.totalReservations}
            </span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">
              Across all accommodation tiers
            </span>
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Confirmed Stays
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-teal-900">
              {overview.confirmedReservations}
            </span>
            <span className="text-xs text-teal-700 block mt-1 font-semibold">
              Guaranteed guest arrivals
            </span>
          </div>
        </div>

        {/* Pending Inquiries */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Actions
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-900">
              {overview.pendingReservations}
            </span>
            <span className="text-xs text-amber-700 block mt-1 font-semibold">
              Requires confirmation or payment
            </span>
          </div>
        </div>
      </div>

      {/* 30-Day Occupancy Band */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start justify-between sm:justify-start gap-4 w-full sm:w-auto">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Occupancy — next {overview.occupancyWindowDays} days
              </span>
              <span className="text-3xl font-extrabold text-slate-900">
                {overview.occupancyRate}%
              </span>
              <span className="text-xs text-slate-500 block mt-1 font-medium">
                {overview.bookedUnitNights} of {overview.capacityUnitNights} unit-nights booked
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0"
          >
            Open month view →
          </Link>
        </div>

        <div
          className="h-3 w-full rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={overview.occupancyRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Resort occupancy over the next ${overview.occupancyWindowDays} days`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${Math.min(100, overview.occupancyRate)}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-2xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {overview.confirmedReservations}{" "}
            confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> {overview.pendingReservations}{" "}
            pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> {overview.cancelledReservations}{" "}
            cancelled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" /> {overview.completedReservations}{" "}
            completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300" /> {overview.accommodationsCount} units
          </span>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Guest Reservations</h2>
            <p className="text-xs text-slate-500">Latest 6 bookings logged in SQLite</p>
          </div>
          <Link
            href="/admin/reservations"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View All ({overview.totalReservations}) →
          </Link>
        </div>

        {overview.recentReservations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No reservations found. Run the seed script or test a booking from the home page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-2xs">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Guest</th>
                  <th className="px-6 py-3.5">Unit</th>
                  <th className="px-6 py-3.5">Dates</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.recentReservations.map((res) => {
                  const mainUnit = res.items[0]?.accommodation?.name || "Multiple items";
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-emerald-900">
                        {res.bookingCode}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 block">{res.user.name}</span>
                        <span className="text-2xs text-slate-500">{res.user.email}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{mainUnit}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {format(new Date(res.checkInDate), "MMM dd")} -{" "}
                        {format(new Date(res.checkOutDate), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₱{res.totalAmount.toLocaleString()}
                        {res.payment && (
                          <span className="block text-2xs font-normal text-slate-500">
                            {res.payment.method} ({res.payment.status})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-2xs uppercase ${
                            res.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : res.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : res.status === "COMPLETED"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <QuickStatusButtons
                          reservationId={res.id}
                          currentStatus={res.status}
                          bookingCode={res.bookingCode}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
