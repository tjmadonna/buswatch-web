import Error from "@/components/error";
import { FavoriteToggle } from "@/components/favorite-toggle";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { useLocalStorage } from "@/hooks/use-local-storage";
import BusArrivalCard from "@/pages/arrivals/bus-arrival-card";
import { BusStopHeader } from "@/pages/arrivals/bus-stop-header";
import BusTimesSkeleton from "@/pages/arrivals/bus-times-skeleton";
import NoArrivals from "@/pages/arrivals/no-arrivals";
import { parseOccupancy } from "@/pages/arrivals/occupancy";
import { RouteFilter } from "@/pages/arrivals/route-filter";
import { REFRESH_INTERVAL, useArrivalsData } from "@/pages/arrivals/use-arrivals-data";
import { RefreshCw, SearchX, ServerCrash } from "lucide-react";
import { useParams } from "react-router";
import * as z from "zod/mini";

export default function ArrivalsPage() {
    const params = useParams<{ stopID: string }>();
    const [hiddenRoutes, setHiddenRoutes] = useLocalStorage(`hiddenRoutes:${params.stopID}`, z.array(z.string()), []);
    const { arrivals, error, isLoading, isRefreshing, lastUpdated, refresh, stop } = useArrivalsData(params.stopID);
    const showSkeleton = useDelayedLoading(isLoading);

    if (!stop) {
        if (isLoading) {
            return showSkeleton ? <BusTimesSkeleton /> : null;
        }

        if (error?.status === 404) {
            return (
                <Error
                    code={404}
                    title="Stop not found"
                    description="The stop you're looking for doesn't exist or may have been moved. Check the stop ID and try again."
                    icon={SearchX}
                />
            );
        }
        return (
            <Error
                code={error?.status ?? 500}
                title="Something went wrong"
                description="We couldn't load this stop right now. Please try again later."
                icon={ServerCrash}
            />
        );
    }

    return (
        <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <BusStopHeader routes={stop.routeIDs} stopID={stop.id} stopName={stop.name} />
                </div>
                <FavoriteToggle stopID={stop.id} />
                <RouteFilter onChange={setHiddenRoutes} routeIDs={stop.routeIDs} selectedRoutes={hiddenRoutes} />
            </div>

            <div className="mt-6 flex items-center justify-between">
                <div className="flex flex-col">
                    <h2 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                        Arriving soon
                    </h2>
                    {lastUpdated && (
                        <p className="text-muted-foreground text-xs">
                            Updated{" "}
                            {lastUpdated.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                            })}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={refresh}
                    disabled={isLoading || isRefreshing}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1.5 rounded-md px-3 py-2.5 text-sm transition-colors disabled:opacity-50 sm:py-1.5"
                    aria-label="Refresh arrival times">
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {arrivals && arrivals.filter((a) => !hiddenRoutes.includes(a.routeID)).length > 0 ? (
                <div className="mt-4 flex flex-col gap-3">
                    {arrivals
                        .filter((a) => !hiddenRoutes.includes(a.routeID))
                        .map((arrival) => (
                            <BusArrivalCard
                                key={arrival.vehicleID}
                                arrivalTime={arrival.arrivalTime}
                                occupancy={parseOccupancy(arrival.occupancy)}
                                routeID={arrival.routeID}
                                tripName={arrival.tripName}
                            />
                        ))}
                </div>
            ) : (
                <NoArrivals />
            )}

            <footer className="border-border text-muted-foreground mt-8 border-t pt-4 text-center text-xs">
                <p>{`Times are estimates and may vary. Data refreshes automatically every ${REFRESH_INTERVAL} seconds.`}</p>
            </footer>
        </main>
    );
}
