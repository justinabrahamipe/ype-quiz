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
        {/* Profile card */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <SkeletonBox className="!rounded-full" height={64} width={64} />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="50%" />
            <SkeletonLine width="70%" />
            <SkeletonLine width="30%" />
          </div>
          <SkeletonBox className="!rounded-full" height={32} width={32} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBox height={100} />
          <SkeletonBox height={100} />
          <SkeletonBox height={100} />
          <SkeletonBox height={100} />
        </div>

        <SkeletonBox height={72} />

        {/* Recent attempts */}
        <SkeletonLine className="mt-2" width={120} />
        <div className="space-y-2">
          <SkeletonBox height={64} />
          <SkeletonBox height={64} />
          <SkeletonBox height={64} />
        </div>
      </main>
    </div>
  );
}
