import { A } from "@solidjs/router";
import { ServerCrash, Star } from "lucide-solid";
import { createMemo, For } from "solid-js";
import * as z from "zod/mini";

import SEO from "@/components/seo";
import type { APIError } from "@/data";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { useLocalStorage } from "@/hooks/use-local-storage";
import FavoriteStopCard from "@/pages/home/favorite-stop-card";
import FavoriteStopsSkeleton from "@/pages/home/favorite-stops-skeleton";

import { useFavoriteStopsData } from "./use-favorite-stops-data";

type DataState = "data" | "empty" | "error" | "loading";

function getDataState(isLoading: boolean, error: APIError | null, count: number): DataState {
    if (isLoading) {
        return "loading";
    }
    if (error) {
        return "error";
    }
    if (count === 0) {
        return "empty";
    }
    return "data";
}

export default function HomePage() {
    const [favoriteStopIDs] = useLocalStorage("favoriteStops", z.array(z.string()), []);

    // Snapshot the favorite IDs once, at mount. If the user unfavorites a
    // stop while viewing this page, we intentionally keep it in the list
    // (its star icon still flips immediately via FavoriteToggle's own live
    // signal) rather than removing the card mid-visit. Passing a fixed
    // accessor here means useFavoriteStopsData's effect never sees stopID
    // changes, so it fetches once and never refetches until this page
    // remounts (refresh or re-navigation), which is when a new snapshot
    // is taken.
    const initialFavoriteStopIDs = favoriteStopIDs();
    const { favoriteStops, error, isLoading } = useFavoriteStopsData(() => initialFavoriteStopIDs);

    const showSkeleton = useDelayedLoading(isLoading);
    const dataState = createMemo(() => getDataState(isLoading(), error(), favoriteStops().length));

    return (
        <main class="mx-auto max-w-xl px-4 py-6">
            <SEO title="Live Pittsburgh Bus Times" />
            <h1 class="text-foreground mb-6 text-2xl font-bold">Favorite Stops</h1>

            {dataState() == "loading" && showSkeleton() && <FavoriteStopsSkeleton />}

            {dataState() == "error" && (
                <div class="flex flex-col items-center gap-4 py-16 text-center">
                    <div class="bg-secondary flex h-16 w-16 items-center justify-center rounded-full">
                        <ServerCrash class="text-muted-foreground h-8 w-8" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="text-foreground font-semibold">Unable to load favorite stops</p>
                        <p class="text-muted-foreground text-sm">
                            Refresh or browse the{" "}
                            <A href="/stops" class="text-primary underline-offset-4 hover:underline">
                                map
                            </A>{" "}
                            to find stops.
                        </p>
                    </div>
                </div>
            )}

            {dataState() == "empty" && (
                <div class="flex flex-col items-center gap-4 py-16 text-center">
                    <div class="bg-secondary flex h-16 w-16 items-center justify-center rounded-full">
                        <Star class="text-muted-foreground h-8 w-8" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="text-foreground font-semibold">No favorite stops yet</p>
                        <p class="text-muted-foreground text-sm">
                            Browse the{" "}
                            <A href="/stops" class="text-primary underline-offset-4 hover:underline">
                                map
                            </A>{" "}
                            or a stop's arrivals page to star your favorites.
                        </p>
                    </div>
                </div>
            )}

            {dataState() == "data" && (
                <div class="flex flex-col gap-3">
                    <For each={favoriteStops()}>{(stop) => <FavoriteStopCard stop={stop} />}</For>
                </div>
            )}
        </main>
    );
}
