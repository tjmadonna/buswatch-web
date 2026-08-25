import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { APIError } from "@/data";
import { fetchRoutePath, fetchRouteVehicles, type PathPoint, type Vehicle } from "@/data/routes";
import { isAbortError } from "@/utils";

export const REFRESH_INTERVAL = 15; // seconds

export function useShapesData(routeID?: string) {
    const [error, setError] = useState<APIError | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, startRefreshTransition] = useTransition();
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [path, setPath] = useState<PathPoint[] | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const routeIDRef = useRef<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const fetchAndUpdateVehicles = useCallback(
        async (id: string, signal: AbortSignal) => {
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
                    clearTimer();
                    return;
                }
                console.error("Failed to refresh vehicles:", err);
            }
        },
        [clearTimer],
    );

    const startTimer = useCallback(
        (id: string, signal: AbortSignal) => {
            clearTimer();
            timerRef.current = window.setInterval(() => {
                void fetchAndUpdateVehicles(id, signal);
            }, REFRESH_INTERVAL * 1000);
        },
        [clearTimer, fetchAndUpdateVehicles],
    );

    useEffect(() => {
        if (routeID === undefined) {
            return;
        }

        const id = routeID;
        routeIDRef.current = id;

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const { signal } = controller;

        async function init() {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchRoutePath(id, signal).then((fetched) => {
                        setPath(fetched);
                    }),
                    fetchRouteVehicles(id, signal).then((fetched) => {
                        setVehicles(fetched);
                        setLastUpdated(new Date());
                    }),
                ]);
                if (signal.aborted) {
                    return;
                }
                setError(null);
                startTimer(id, signal);
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
        }

        void init();

        return () => {
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            clearTimer();
        };
    }, [routeID, clearTimer, startTimer]);

    const refresh = useCallback(() => {
        const id = routeIDRef.current;
        if (id === null) {
            return;
        }

        clearTimer();
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        startRefreshTransition(async () => {
            await fetchAndUpdateVehicles(id, controller.signal);
            startTimer(id, controller.signal);
        });
    }, [clearTimer, fetchAndUpdateVehicles, startRefreshTransition, startTimer]);

    return {
        error: error,
        isLoading: isLoading,
        isRefreshing: isRefreshing,
        lastUpdated: lastUpdated,
        path: path,
        refresh: refresh,
        vehicles: vehicles,
    };
}
