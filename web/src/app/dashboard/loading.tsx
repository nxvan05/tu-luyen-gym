export default function DashboardLoading() {
  const box = "animate-pulse rounded-2xl bg-card/70";
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className={`h-9 w-72 ${box}`} />
          <div className={`h-4 w-56 ${box}`} />
        </div>
        <div className={`h-11 w-40 rounded-full ${box}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className={`h-40 w-full ${box}`} />
          <div className={`h-44 w-full ${box}`} />
        </div>
        <div className="space-y-4">
          <div className={`h-48 w-full ${box}`} />
          <div className={`h-40 w-full ${box}`} />
        </div>
      </div>
    </main>
  );
}
