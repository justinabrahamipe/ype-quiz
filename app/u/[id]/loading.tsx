import { SkeletonBox, SkeletonLine } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-3">
        <SkeletonBox className="!rounded-full" height={40} width={40} />
        <SkeletonLine width={180} className="!h-4" />
        <SkeletonBox
          className="!rounded-full mt-4"
          height={120}
          width={120}
        />
        <SkeletonLine width="50%" className="!h-10" />
        <SkeletonLine width="40%" />
        <div className="flex gap-6 mt-2">
          <SkeletonLine width={70} />
          <SkeletonLine width={70} />
        </div>
        <SkeletonBox height={40} width={220} className="mt-4" />
      </div>
    </div>
  );
}
