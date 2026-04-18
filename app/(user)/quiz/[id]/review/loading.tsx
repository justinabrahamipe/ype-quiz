import {
  SkeletonBox,
  SkeletonHeaderBar,
  SkeletonLine,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <SkeletonHeaderBar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <SkeletonLine width={120} />
          <SkeletonLine width="50%" className="!h-6" />
          <SkeletonLine width="30%" />
        </div>

        {/* Score card */}
        <SkeletonBox height={120} />

        {/* Question cards */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <SkeletonLine width={80} />
                <SkeletonLine width={60} />
              </div>
              <SkeletonLine width="85%" className="!h-5" />
              <SkeletonLine width="55%" />
              <SkeletonLine width="45%" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
