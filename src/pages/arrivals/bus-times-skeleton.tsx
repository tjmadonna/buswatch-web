import { Index } from "solid-js";

import Skeleton from "@/components/skeleton";

const ROUTE_BADGE_COUNT = 5;
const ARRIVAL_CARD_COUNT = 5;

export default function BusTimesSkeleton() {
    return (
        <main class="mx-auto min-h-screen max-w-xl px-4 py-6">
            {/* Header skeleton */}
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <header class="flex flex-col gap-4">
                        <div class="flex items-start gap-3">
                            <Skeleton class="h-10 w-10 rounded-lg" />
                            <div class="flex flex-col gap-1.5">
                                <Skeleton class="h-6 w-52" />
                                <Skeleton class="h-4 w-20" />
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <Index each={Array.from({ length: ROUTE_BADGE_COUNT })}>
                                {() => <Skeleton class="h-7 w-10 rounded-md" />}
                            </Index>
                        </div>
                    </header>
                </div>
                <div class="flex gap-2">
                    <Skeleton class="h-9 w-9 rounded-md" />
                    <Skeleton class="h-9 w-9 rounded-md" />
                </div>
            </div>

            {/* Subheader skeleton */}
            <div class="mt-6 flex items-center justify-between">
                <div class="flex flex-col gap-1.5">
                    <Skeleton class="h-4 w-28" />
                    <Skeleton class="h-3 w-36" />
                </div>
                <Skeleton class="h-8 w-24 rounded-md" />
            </div>

            {/* Arrival cards skeleton */}
            <div class="mt-4 flex flex-col gap-3">
                <Index each={Array.from({ length: ARRIVAL_CARD_COUNT })}>{() => <ArrivalCardSkeleton />}</Index>
            </div>

            {/* Footer skeleton */}
            <div class="border-border mt-8 flex justify-center border-t pt-4">
                <Skeleton class="h-3 w-72" />
            </div>
        </main>
    );
}

function ArrivalCardSkeleton() {
    return (
        <div class="border-border bg-card flex items-center gap-4 rounded-lg border p-4">
            <Skeleton class="h-12 w-12 rounded-lg" />
            <div class="flex min-w-0 flex-1 flex-col gap-2">
                <div class="flex items-center gap-2">
                    <Skeleton class="h-4 w-4 rounded" />
                    <Skeleton class="h-4 w-32" />
                </div>
                <div class="flex items-center gap-2">
                    <Skeleton class="h-4 w-4 rounded" />
                    <div class="flex gap-0.5">
                        <Skeleton class="h-3 w-1.5 rounded-sm" />
                        <Skeleton class="h-3 w-1.5 rounded-sm" />
                        <Skeleton class="h-3 w-1.5 rounded-sm" />
                    </div>
                    <Skeleton class="h-3 w-16" />
                </div>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-2">
                <Skeleton class="h-6 w-14" />
                <Skeleton class="h-3 w-12" />
            </div>
        </div>
    );
}
