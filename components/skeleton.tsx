import { clsx } from "./cn";

export function SkeletonBox({
  className,
  height,
  width,
}: {
  className?: string;
  height?: number | string;
  width?: number | string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse",
        className
      )}
      style={{ height, width }}
    />
  );
}

export function SkeletonLine({
  className,
  width,
}: {
  className?: string;
  width?: number | string;
}) {
  return (
    <div
      className={clsx(
        "h-3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse",
        className
      )}
      style={{ width }}
    />
  );
}

export function SkeletonHeaderBar() {
  return (
    <div className="sticky top-0 z-10 h-14 border-b border-slate-200 dark:border-slate-800 bg-background/80 backdrop-blur" />
  );
}
