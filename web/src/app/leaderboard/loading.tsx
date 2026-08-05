export default function LeaderboardLoading() {
  const box = "animate-pulse rounded-2xl bg-card/70";
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className={`h-9 w-64 ${box}`} />
      <div className={`mt-2 h-4 w-48 ${box}`} />
      <div className={`mt-6 h-10 w-full rounded-full ${box}`} />
      <div className="mt-6 space-y-2">
        <div className={`h-16 w-full ${box}`} />
        <div className={`h-16 w-full ${box}`} />
        <div className={`h-16 w-full ${box}`} />
      </div>
    </main>
  );
}
