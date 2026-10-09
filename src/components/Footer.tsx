import Link from "next/link";
import { Palmtree, MapPin, Phone, Mail, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                <Palmtree className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Solara Azure Resort
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Your secluded paradise destination offering luxury coastal villas, tropical bamboo cottages, and breathtaking sunset ocean vistas.
            </p>
            <div className="pt-2 text-xs text-emerald-400 font-mono">
              Academic Project • SQLite & Next.js Monolith
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Explore</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#accommodations" className="hover:text-emerald-400 transition-colors">
                  Villas & Suites
                </a>
              </li>
              <li>
                <a href="#amenities" className="hover:text-emerald-400 transition-colors">
                  Facilities & Dining
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors">
                  Staff / Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Resort Office</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Azure Coast Highway, Paradise Bay, PH</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+63 (02) 8123-4567 / +63 912 345 6789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>reservations@solara-azure.ph</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Solara Azure Resort Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-1 hover:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Admin Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
