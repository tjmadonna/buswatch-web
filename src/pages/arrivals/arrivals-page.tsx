import { useParams } from "@solidjs/router";
import { RefreshCw, SearchX, ServerCrash } from "lucide-solid";
import { createMemo, For, Match, Show, Switch } from "solid-js";

import Error from "@/components/error";
import { FavoriteToggle } from "@/components/favorite-toggle";
import SEO from "@/components/seo";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import BusArrivalCard from "@/pages/arrivals/bus-arrival-card";
import { BusStopHeader, RouteBadgeList } from "@/pages/arrivals/bus-stop-header";
import BusTimesSkeleton from "@/pages/arrivals/bus-times-skeleton";
import NoArrivals from "@/pages/arrivals/no-arrivals";
import { parseOccupancy } from "@/pages/arrivals/occupancy";
import { RouteFilter } from "@/pages/arrivals/route-filter";
import { REFRESH_INTERVAL, useArrivalsData } from "@/pages/arrivals/use-arrivals-data";
import { useTimer } from "@/pages/arrivals/use-timer";

import { useHiddenRoutes } from "./use-hidden-routes";

export default function ArrivalsPage() {
    const params = useParams<{ stopID: string }>();
    const { hiddenRoutes, setHiddenRoutes } = useHiddenRoutes(() => params.stopID);
    const { arrivals, error, isLoading, isRefreshing, lastUpdated, refresh, stop } = useArrivalsData(
        () => params.stopID,
    );
    const { currentTime } = useTimer();
    const showSkeleton = useDelayedLoading(isLoading);

    const visibleArrivals = createMemo(() => (arrivals() ?? []).filter((a) => !hiddenRoutes().includes(a.routeID)));

    return (
        <Switch
            fallback={
                <Error
                    code={error()?.status ?? 500}
                    title="Something went wrong"
                    description="We couldn't load this stop right now. Please try again later."
                    icon={ServerCrash}
                />
            }>
            <Match when={stop()}>
                {(stop) => (
                    <main class="mx-auto min-h-screen max-w-xl px-4 py-6">
                        <SEO
                            title={`${stop().name} Bus Arrivals`}
                            description={`See live Pittsburgh bus arrival times for ${stop().name}, including routes ${stop().routeIDs.join(", ")}.`}
                        />
                        <div class="flex flex-col gap-3">
                            <div class="flex items-start justify-between gap-2">
                                <BusStopHeader stopID={stop().id} stopName={stop().name} />
                                <div class="flex shrink-0 items-center gap-1">
                                    <FavoriteToggle stopID={stop().id} />
                                    <RouteFilter
                                        onChange={setHiddenRoutes}
                                        routeIDs={stop().routeIDs}
                                        selectedRoutes={hiddenRoutes()}
                                    />
                                </div>
                            </div>

                            <RouteBadgeList routes={stop().routeIDs} />
                        </div>

                        <div class="mt-6 flex items-center justify-between">
                            <div class="flex flex-col">
                                <h2 class="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                                    Arriving soon
                                </h2>
                                <Show when={lastUpdated()}>
                                    {(updated) => (
                                        <p class="text-muted-foreground text-xs">
                                            Updated{" "}
                                            {updated().toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            })}
                                        </p>
                                    )}
                                </Show>
                            </div>
                            <button
                                type="button"
                                onClick={refresh}
                                disabled={isLoading() || isRefreshing()}
                                class="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1.5 rounded-md px-3 py-2.5 text-sm transition-colors disabled:opacity-50 sm:py-1.5"
                                aria-label="Refresh arrival times">
                                <RefreshCw class={`h-3.5 w-3.5 ${isRefreshing() ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        </div>

                        <Show when={visibleArrivals().length > 0} fallback={<NoArrivals />}>
                            <div class="mt-4 flex flex-col gap-3">
                                <For each={visibleArrivals()}>
                                    {(arrival) => (
                                        <BusArrivalCard
                                            arrivalTime={arrival.arrivalTime}
                                            currentTime={currentTime()}
                                            occupancy={parseOccupancy(arrival.occupancy)}
                                            routeID={arrival.routeID}
                                            stopLatitude={stop().latitude}
                                            stopLongitude={stop().longitude}
                                            stopName={stop().name}
                                            tripName={arrival.tripName}
                                        />
                                    )}
                                </For>
                            </div>
                        </Show>

                        <footer class="border-border text-muted-foreground mt-8 border-t pt-4 text-center text-xs">
                            <p>{`Times are estimates and may vary. Data refreshes automatically every ${REFRESH_INTERVAL} seconds.`}</p>
                        </footer>
                    </main>
                )}
            </Match>

            <Match when={isLoading()}>
                <Show when={showSkeleton()}>
                    <BusTimesSkeleton />
                </Show>
            </Match>

            <Match when={error()?.status === 404}>
                <Error
                    code={404}
                    title="Stop not found"
                    description="The stop you're looking for doesn't exist or may have been moved. Check the stop ID and try again."
                    icon={SearchX}
                />
            </Match>
        </Switch>
    );
}
