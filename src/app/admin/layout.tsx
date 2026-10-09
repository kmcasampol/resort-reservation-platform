import { getAdminSession } from "@/lib/auth";
import Link from "next/link";
import {
  Palmtree,
  LayoutDashboard,
  CalendarCheck2,
  CalendarDays,
  BedDouble,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import AdminLogoutButton from "./AdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // Not signed in: render the child page (the login screen) on its own, with
  // no console chrome. Every admin subpage also calls `requireAdmin()`, and
  // `proxy.ts` issues the HTTP redirect — this branch just keeps the login
  // screen from being wrapped in a sidebar it cannot use.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
              <Palmtree className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block">
                Solara Azure
              </span>
              <span className="text-2xs uppercase tracking-widest text-emerald-400 font-semibold block">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Signed-in administrator */}
        <div className="px-6 py-4 border-b border-slate-800">
          <span className="text-2xs uppercase tracking-widest text-slate-400 block font-bold">
            Signed in as
          </span>
          <span className="text-sm font-semibold text-white block truncate">{session.name}</span>
          <span className="text-2xs text-slate-400 block truncate">{session.email}</span>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1 grow">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-colors text-slate-300"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            <span>Dashboard Overview</span>
          </Link>

          <Link
            href="/admin/reservations"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-colors text-slate-300"
          >
            <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Reservations</span>
          </Link>

          <Link
            href="/admin/calendar"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-colors text-slate-300"
          >
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <span>Occupancy Calendar</span>
          </Link>

          <Link
            href="/admin/accommodations"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-colors text-slate-300"
          >
            <BedDouble className="w-4 h-4 text-emerald-400" />
            <span>Accommodations</span>
          </Link>

          <Link
            href="/admin/amenities"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition-colors text-slate-300"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Resort Amenities</span>
          </Link>
        </nav>

        {/* User Info & Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> View Public Site
            </span>
          </Link>

          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="grow p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
