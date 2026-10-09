import Link from "next/link";
import { Palmtree, Compass, ArrowLeft, CalendarSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <p className="text-2xs font-bold uppercase tracking-[0.2em] text-emerald-700">Error 404</p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            This path leads out to sea
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page you are looking for does not exist or may have been moved. If you are trying
            to retrieve an existing reservation, you can look it up with your booking code.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back Home
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
          >
            <CalendarSearch className="w-4 h-4" /> Find My Booking
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <Palmtree className="w-4 h-4" /> Solara Azure Resort
        </Link>
      </div>
    </div>
  );
}
