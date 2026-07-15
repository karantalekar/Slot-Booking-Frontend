export function SlotSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <article
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse"
        >
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-full" />
        </article>
      ))}
    </div>
  );
}
