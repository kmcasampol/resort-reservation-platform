"use client";

import { Printer } from "lucide-react";

/**
 * `window.print()` must run in the browser — an inline `<script>` inside a
 * React tree is not reliably re-executed after hydration.
 */
export default function PrintButton({ label = "Print Receipt" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-2xs font-bold transition-colors cursor-pointer"
    >
      <Printer className="w-3 h-3" />
      {label}
    </button>
  );
}
