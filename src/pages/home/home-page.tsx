import { useLocalStorage } from "@/hooks/use-local-storage";
import FavoriteStopCard from "@/pages/home/favorite-stop-card";
import FavoriteStopsSkeleton from "@/pages/home/favorite-stops-skeleton";
import { useFavoriteStopsData } from "@/pages/home/use-favorite-stops-data";
import { ServerCrash, Star } from "lucide-react";
import { Link } from "react-router";
import * as z from "zod/mini";

type DataState = "data" | "empty" | "error" | "loading";

function getDataState(isLoading: boolean, error: unknown, count: number): DataState {
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
    const { favoriteStops, error, isLoading } = useFavoriteStopsData(favoriteStopIDs);

    const dataState = getDataState(isLoading, error, favoriteStops.length);

    return (
        <main className="mx-auto max-w-xl px-4 py-6">
            <h1 className="text-foreground mb-6 text-2xl font-bold">Favorite Stops</h1>

            {dataState == "loading" && <FavoriteStopsSkeleton />}

            {dataState == "error" && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <div className="bg-secondary flex h-16 w-16 items-center justify-center rounded-full">
                        <ServerCrash className="text-muted-foreground h-8 w-8" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-foreground font-semibold">Unable to load favorite stops</p>
                        <p className="text-muted-foreground text-sm">
                            Refresh or browse the{" "}
                            <Link to="/stops" className="text-primary underline-offset-4 hover:underline">
                                map
                            </Link>{" "}
                            to find stops.
                        </p>
                    </div>
                </div>
            )}

            {dataState == "empty" && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                    <div className="bg-secondary flex h-16 w-16 items-center justify-center rounded-full">
                        <Star className="text-muted-foreground h-8 w-8" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-foreground font-semibold">No favorite stops yet</p>
                        <p className="text-muted-foreground text-sm">
                            Browse the{" "}
                            <Link to="/stops" className="text-primary underline-offset-4 hover:underline">
                                map
                            </Link>{" "}
                            or a stop's arrivals page to star your favorites.
                        </p>
                    </div>
                </div>
            )}

            {dataState == "data" && (
                <div className="flex flex-col gap-3">
                    {favoriteStops.map((stop) => (
                        <FavoriteStopCard key={stop.id} stop={stop} />
                    ))}
                </div>
            )}
        </main>
    );
}
