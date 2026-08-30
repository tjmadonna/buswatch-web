import { Index } from "solid-js";

import Skeleton from "@/components/skeleton";

function FavoriteStopCardSkeleton() {
    return (
        <div class="bg-card border-border flex flex-col gap-3 rounded-xl border p-4">
            <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                    <Skeleton class="h-10 w-10 shrink-0 rounded-lg" />
                    <div class="flex flex-col gap-1.5">
                        <Skeleton class="h-4 w-36" />
                        <Skeleton class="h-3.5 w-20" />
                    </div>
                </div>
                <Skeleton class="h-11 w-11 shrink-0 rounded-md sm:h-9 sm:w-9" />
            </div>
            <div class="flex gap-1.5">
                <Skeleton class="h-5 w-8 rounded-md" />
                <Skeleton class="h-5 w-8 rounded-md" />
                <Skeleton class="h-5 w-8 rounded-md" />
            </div>
        </div>
    );
}

export default function FavoriteStopsSkeleton() {
    return (
        <div class="flex flex-col gap-3">
            <Index each={Array.from({ length: 3 })}>{() => <FavoriteStopCardSkeleton />}</Index>
        </div>
    );
}
