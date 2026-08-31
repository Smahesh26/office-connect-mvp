interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white overflow-hidden">
      <Skeleton className="aspect-square w-full !rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="pt-1">
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  );
}

function CategoryNavSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 shrink-0 !rounded-full" />
      ))}
    </div>
  );
}

function HeroBannerSkeleton() {
  return (
    <div className="w-full">
      <Skeleton className="h-[320px] w-full !rounded-none" />
    </div>
  );
}

export { Skeleton, ProductCardSkeleton, CategoryNavSkeleton, HeroBannerSkeleton };
