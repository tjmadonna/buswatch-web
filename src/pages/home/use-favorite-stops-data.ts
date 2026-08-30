import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

import { APIError } from "@/data";
import { fetchStops, type Stop } from "@/data/stops";
import { isAbortError } from "@/utils";

export function useFavoriteStopsData(stopIDs: Accessor<string[]>) {
    const [favoriteStops, setFavoriteStops] = createSignal<Stop[]>([]);
    const [error, setError] = createSignal<APIError | null>(null);
    const [isLoading, setIsLoading] = createSignal<boolean>(true);

    createEffect(() => {
        const ids = stopIDs();
        const abortController = new AbortController();

        async function fetchOnChange(signal: AbortSignal) {
            if (ids.length === 0) {
                setFavoriteStops([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const fetchedStops = await fetchStops(ids, signal);
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
        }

        void fetchOnChange(abortController.signal);

        onCleanup(() => {
            abortController.abort();
        });
    });

    return { favoriteStops, error, isLoading };
}
