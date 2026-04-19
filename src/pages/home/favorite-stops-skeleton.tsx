import Skeleton from "@/components/skeleton";

function FavoriteStopCardSkeleton() {
    return (
        <div className="bg-card border-border flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                    <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3.5 w-20" />
                    </div>
                </div>
                <Skeleton className="h-11 w-11 shrink-0 rounded-md sm:h-9 sm:w-9" />
            </div>
            <div className="flex gap-1.5">
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-5 w-8 rounded-md" />
            </div>
        </div>
    );
}

export default function FavoriteStopsSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <FavoriteStopCardSkeleton key={i} />
            ))}
        </div>
    );
}
