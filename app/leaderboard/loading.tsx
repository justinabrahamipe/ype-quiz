import {
  SkeletonBox,
  SkeletonHeaderBar,
  SkeletonLine,
} from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <SkeletonHeaderBar />
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonLine width={140} className="!h-6" />
            <SkeletonLine width={180} />
          </div>
          <SkeletonBox height={34} width={84} />
        </div>

        {/* Podium */}
        <SkeletonBox height={220} />

        {/* List */}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <SkeletonLine width={20} />
              <SkeletonBox className="!rounded-full" height={40} width={40} />
              <div className="flex-1 space-y-1.5">
                <SkeletonLine width="45%" />
                <SkeletonLine width="30%" />
              </div>
              <SkeletonLine width={50} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
