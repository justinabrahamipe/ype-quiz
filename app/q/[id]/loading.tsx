import { SkeletonBox, SkeletonLine } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-3">
        <SkeletonBox className="!rounded-full" height={40} width={40} />
        <SkeletonLine width={180} className="!h-4" />
        <SkeletonLine width="80%" className="!h-10 mt-4" />
        <SkeletonLine width="60%" />
        <SkeletonBox height={40} width={220} className="mt-4" />
      </div>
    </div>
  );
}
