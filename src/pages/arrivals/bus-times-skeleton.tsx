import Skeleton from "@/components/skeleton";

export default function BusTimesSkeleton() {
    return (
        <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
            {/* Header skeleton */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <header className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="flex flex-col gap-1.5">
                                <Skeleton className="h-6 w-52" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-7 w-10 rounded-md" />
                            ))}
                        </div>
                    </header>
                </div>
                <Skeleton className="h-9 w-9 rounded-md" />
            </div>

            {/* Subheader skeleton */}
            <div className="mt-6 flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-8 w-24 rounded-md" />
            </div>

            {/* Arrival cards skeleton */}
            <div className="mt-4 flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <ArrivalCardSkeleton key={i} />
                ))}
            </div>

            {/* Footer skeleton */}
            <div className="border-border mt-8 flex justify-center border-t pt-4">
                <Skeleton className="h-3 w-72" />
            </div>
        </main>
    );
}

function ArrivalCardSkeleton() {
    return (
        <div className="border-border bg-card flex items-center gap-4 rounded-lg border p-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex gap-0.5">
                        <Skeleton className="h-3 w-1.5 rounded-sm" />
                        <Skeleton className="h-3 w-1.5 rounded-sm" />
                        <Skeleton className="h-3 w-1.5 rounded-sm" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-3 w-12" />
            </div>
        </div>
    );
}
