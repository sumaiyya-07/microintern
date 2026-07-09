export default function CompanyDashboardLoading() {
  return (
    <div className="container-custom py-10 space-y-10 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-9 w-64 bg-border rounded-md" />
          <div className="h-4 w-96 bg-border/60 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-border rounded-md" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-surface border border-border/70 rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="h-3 w-16 bg-border rounded" />
            <div className="h-7 w-10 bg-border/80 rounded" />
          </div>
        ))}
      </div>

      {/* Tasks skeleton header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="h-7 w-48 bg-border rounded" />
          <div className="h-6 w-24 bg-border/50 rounded-full" />
        </div>

        {/* Tasks grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border/80 rounded-xl h-48 flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-28 bg-border/60 rounded-full" />
                  <div className="h-5 w-16 bg-border/40 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-border rounded" />
                  <div className="h-4 w-full bg-border/60 rounded" />
                  <div className="h-4 w-5/6 bg-border/60 rounded" />
                </div>
              </div>
              <div className="bg-background px-6 py-4 flex items-center justify-between">
                <div className="flex space-x-4">
                  <div className="h-4 w-20 bg-border/60 rounded" />
                  <div className="h-4 w-24 bg-border/60 rounded" />
                </div>
                <div className="h-4 w-24 bg-border rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
