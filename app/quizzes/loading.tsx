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
        {/* Profile row */}
        <div className="flex items-center gap-3 p-2">
          <SkeletonBox className="!rounded-full" height={44} width={44} />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="40%" />
            <SkeletonLine width="24%" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBox height={96} />
          <SkeletonBox height={96} />
        </div>

        {/* Section header */}
        <SkeletonLine className="mt-4" width={120} />

        {/* Quiz cards */}
        <div className="space-y-3">
          <SkeletonBox height={120} />
          <SkeletonBox height={120} />
          <SkeletonBox height={120} />
        </div>
      </main>
    </div>
  );
}
