function SidebarSkeleton() {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-pink-100 bg-surface">
      <div className="border-b border-pink-100 px-4 py-4">
        <div className="h-7 w-16 animate-pulse rounded bg-pink-200" />
      </div>
      <div className="px-3 py-3">
        <div className="h-10 w-full animate-pulse rounded-xl bg-pink-200" />
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-3">
            <div className="h-4 flex-1 animate-pulse rounded bg-pink-100" />
            <div className="h-3 w-10 animate-pulse rounded bg-pink-100" />
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-2 border-t border-pink-100 px-4 py-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-pink-200" />
        <div className="h-4 flex-1 animate-pulse rounded bg-pink-100" />
      </div>
    </aside>
  );
}

export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarSkeleton />
      <main className="flex flex-1 items-center justify-center bg-bg-base">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-300 border-t-pink-500" />
      </main>
    </div>
  );
}
