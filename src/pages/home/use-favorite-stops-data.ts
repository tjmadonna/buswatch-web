import { APIError } from "@/data";
import { fetchStops, type Stop } from "@/data/stops";
import { isAbortError } from "@/utils";
import { useEffect, useEffectEvent, useState } from "react";

export function useFavoriteStopsData(stopIDs: string[]) {
    const [favoriteStops, setFavoriteStops] = useState<Stop[]>([]);
    const [error, setError] = useState<APIError | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchOnMount = useEffectEvent(async (signal: AbortSignal) => {
        if (stopIDs.length === 0) {
            setFavoriteStops([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const fetchedStops = await fetchStops(stopIDs, signal);
            setFavoriteStops(fetchedStops);
            setError(null);
        } catch (err: unknown) {
            if (isAbortError(err)) {
                return;
            }
            setError(err instanceof APIError ? err : new APIError(500, ""));
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    });

    useEffect(() => {
        const abortController = new AbortController();
        void fetchOnMount(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, []);

    return { favoriteStops: favoriteStops, error: error, isLoading: isLoading };
}
