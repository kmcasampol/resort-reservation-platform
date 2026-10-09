export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar skeleton */}
      <aside className="w-full md:w-64 bg-slate-900 shrink-0 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-24 bg-slate-800 rounded animate-pulse" />
            <div className="h-2 w-16 bg-slate-800 rounded animate-pulse" />
          </div>
        </div>

        <div className="pt-4 space-y-2.5 border-t border-slate-800">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 bg-slate-800/70 rounded-xl animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Main skeleton */}
      <main className="grow p-6 md:p-10 space-y-6">
        <div className="h-7 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-3 w-96 max-w-full bg-slate-200 rounded animate-pulse" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          ))}
        </div>

        <div className="h-72 bg-white rounded-3xl border border-slate-200 animate-pulse" />
      </main>
    </div>
  );
}
