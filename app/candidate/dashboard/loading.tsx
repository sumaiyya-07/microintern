export default function CandidateDashboardLoading() {
  return (
    <div className="container-custom py-10 space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-border rounded-md" />
          <div className="h-4 w-96 bg-border/60 rounded-md" />
        </div>
        <div className="h-10 w-40 bg-border rounded-md" />
      </div>

      {/* Applications list skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="h-7 w-40 bg-border rounded" />
          <div className="h-6 w-24 bg-border/50 rounded-full" />
        </div>

        {/* Grid/List of items */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border/80 rounded-xl p-6 md:p-8 space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-24 bg-border/60 rounded-full" />
                    <div className="h-5 w-16 bg-border/60 rounded-full" />
                  </div>
                  <div className="h-7 w-96 bg-border rounded" />
                  <div className="h-4 w-48 bg-border/50 rounded" />
                </div>
                <div className="flex gap-2 self-start">
                  <div className="h-4 w-28 bg-border/50 rounded" />
                  <div className="h-4 w-24 bg-border/50 rounded" />
                </div>
              </div>

              <div className="border-t border-border/85 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <div className="h-4 w-28 bg-border/60 rounded" />
                  <div className="h-12 w-full bg-border/40 rounded-lg" />
                </div>
                <div className="h-24 bg-background border border-border/70 rounded-xl p-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
