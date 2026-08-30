import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

import { APIError } from "@/data";
import { type Arrival, fetchArrivals } from "@/data/arrivals";
import { fetchStop, type Stop } from "@/data/stops";
import { isAbortError } from "@/utils";

export const REFRESH_INTERVAL = 15; // seconds

export function useArrivalsData(stopID: Accessor<string | undefined>) {
    const [arrivals, setArrivals] = createSignal<Arrival[] | null>(null);
    const [error, setError] = createSignal<APIError | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [lastUpdated, setLastUpdated] = createSignal<Date | null>(null);
    const [stop, setStop] = createSignal<Stop | null>(null);

    // Bookkeeping read by refresh(), which runs outside the reactive effect below.
    let activeStopID: string | null = null;
    let activeController: AbortController | null = null;
    let refreshTimer: number | null = null;

    function stopRefreshTimer() {
        if (refreshTimer !== null) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    }

    function startRefreshTimer(id: string, signal: AbortSignal) {
        stopRefreshTimer();
        refreshTimer = window.setInterval(() => void pollArrivals(id, signal), REFRESH_INTERVAL * 1000);
    }

    // Background refresh: updates arrivals without touching isLoading.
    async function pollArrivals(id: string, signal: AbortSignal) {
        try {
            const fetched = await fetchArrivals(id, signal);
            setArrivals(fetched);
            setLastUpdated(new Date());
            setError(null);
        } catch (err: unknown) {
            if (!isAbortError(err)) {
                console.error("Failed to refresh arrivals:", err);
            }
        }
    }

    // Aborts whatever request is currently in flight and starts tracking a new one.
    function beginRequest(id: string): AbortSignal {
        activeController?.abort();
        const controller = new AbortController();
        activeController = controller;
        activeStopID = id;
        return controller.signal;
    }

    // Refetch everything whenever stopID changes, then start polling for updates.
    createEffect(() => {
        const id = stopID();
        if (id === undefined) {
            return;
        }

        const signal = beginRequest(id);
        setIsLoading(true);

        void (async () => {
            try {
                const [fetchedStop, fetchedArrivals] = await Promise.all([
                    fetchStop(id, signal),
                    fetchArrivals(id, signal),
                ]);
                setStop(fetchedStop);
                setArrivals(fetchedArrivals);
                setLastUpdated(new Date());
                setError(null);
                startRefreshTimer(id, signal);
            } catch (err: unknown) {
                if (isAbortError(err)) {
                    return;
                }
                setStop(null);
                setArrivals(null);
                setError(err instanceof APIError ? err : new APIError(500, ""));
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        })();

        onCleanup(() => {
            activeController?.abort();
            stopRefreshTimer();
        });
    });

    // Manually triggered refresh, e.g. a pull-to-refresh or refresh button.
    function refresh() {
        if (activeStopID === null) {
            return;
        }

        const id = activeStopID;
        const signal = beginRequest(id);

        setIsRefreshing(true);
        void (async () => {
            await pollArrivals(id, signal);
            startRefreshTimer(id, signal);
            setIsRefreshing(false);
        })();
    }

    return { arrivals, error, isLoading, isRefreshing, lastUpdated, refresh, stop };
}
