import type { Accessor } from "solid-js";
import { createEffect, createSignal, onCleanup } from "solid-js";

import { APIError } from "@/data";
import { fetchRoutePath, fetchRouteVehicles, type PathPoint, type Vehicle } from "@/data/routes";
import { isAbortError } from "@/utils";

export const REFRESH_INTERVAL = 15; // seconds

export function useShapesData(routeID: Accessor<string | undefined>) {
    const [error, setError] = createSignal<APIError | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [lastUpdated, setLastUpdated] = createSignal<Date | null>(null);
    const [path, setPath] = createSignal<PathPoint[] | null>(null);
    const [vehicles, setVehicles] = createSignal<Vehicle[] | null>(null);

    let activeRouteID: string | null = null;
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
        refreshTimer = window.setInterval(() => void pollVehicles(id, signal), REFRESH_INTERVAL * 1000);
    }

    async function pollVehicles(id: string, signal: AbortSignal) {
        try {
            const fetched = await fetchRouteVehicles(id, signal);
            setVehicles(fetched);
            setLastUpdated(new Date());
            setError(null);
        } catch (err: unknown) {
            if (isAbortError(err)) {
                return;
            }
            if (err instanceof APIError && err.status === 404) {
                setError(err);
                stopRefreshTimer();
                return;
            }
            console.error("Failed to refresh vehicles:", err);
        }
    }

    function beginRequest(id: string): AbortSignal {
        activeController?.abort();
        const controller = new AbortController();
        activeController = controller;
        activeRouteID = id;
        return controller.signal;
    }

    createEffect(() => {
        const id = routeID();
        if (id === undefined) {
            return;
        }

        const signal = beginRequest(id);
        setIsLoading(true);

        void (async () => {
            try {
                await Promise.all([
                    fetchRoutePath(id, signal).then((fetched) => setPath(fetched)),
                    fetchRouteVehicles(id, signal).then((fetched) => {
                        setVehicles(fetched);
                        setLastUpdated(new Date());
                    }),
                ]);
                if (signal.aborted) {
                    return;
                }
                setError(null);
                startRefreshTimer(id, signal);
            } catch (err: unknown) {
                if (isAbortError(err)) {
                    return;
                }
                setPath(null);
                setVehicles(null);
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

    function refresh() {
        if (activeRouteID === null) {
            return;
        }

        const id = activeRouteID;
        const signal = beginRequest(id);

        setIsRefreshing(true);
        void (async () => {
            await pollVehicles(id, signal);
            startRefreshTimer(id, signal);
            setIsRefreshing(false);
        })();
    }

    return { error, isLoading, isRefreshing, lastUpdated, path, refresh, vehicles };
}
