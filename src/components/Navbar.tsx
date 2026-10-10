"use client";

import { useState } from "react";
import Link from "next/link";
import { Palmtree, Search, ShieldCheck, Menu, X, User, LogOut, Sparkles } from "lucide-react";
import type { UserSession } from "@/lib/auth";
import { logoutUserAction } from "@/actions/auth";

interface NavbarProps {
  onOpenLookup: () => void;
  currentUser: UserSession | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
}

export default function Navbar({
  onOpenLookup,
  currentUser,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUserAction();
    onLogout();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Palmtree className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-800 bg-clip-text text-transparent block tracking-tight">
              Solara Azure
            </span>
            <span className="text-xs uppercase tracking-widest text-emerald-700 font-semibold block">
              Resort & Coastal Retreat
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#accommodations"
            className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
          >
            Villas & Cottages
          </a>
          <a
            href="#amenities"
            className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
          >
            Resort Amenities
          </a>
          <a
            href="#experiences"
            className="text-sm font-medium text-slate-600 hover:text-emerald-700 transition-colors"
          >
            Experiences
          </a>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenLookup}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200/60 shadow-2xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            Find Reservation
          </button>

          {/* User Account / Sign In State */}
          {currentUser ? (
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                {currentUser.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="p-1 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth("login")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth("register")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}

          {/* Admin link */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Admin
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenLookup}
            className="p-2 text-emerald-800 hover:bg-emerald-50 rounded-lg"
            title="Search booking"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-emerald-100 px-4 pt-2 pb-6 space-y-3">
          <a
            href="#accommodations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg"
          >
            Villas & Cottages
          </a>
          <a
            href="#amenities"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg"
          >
            Resort Amenities
          </a>
          <a
            href="#experiences"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg"
          >
            Experiences
          </a>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{currentUser.name}</span>
                  <span className="text-2xs text-slate-500 block">{currentUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth("login");
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-xl text-center"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth("register");
                  }}
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-700 rounded-xl text-center"
                >
                  Create Account
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLookup();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200"
            >
              <Search className="w-4 h-4" /> Check Reservation Status
            </button>

            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-xl"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
