import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { APIError } from "@/data";
import { type Arrival, fetchArrivals } from "@/data/arrivals";
import { fetchStop, type Stop } from "@/data/stops";
import { isAbortError } from "@/utils";

export const REFRESH_INTERVAL = 15; // seconds

export function useArrivalsData(stopID?: string) {
    const [arrivals, setArrivals] = useState<Arrival[] | null>(null);
    const [error, setError] = useState<APIError | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, startRefreshTransition] = useTransition();
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [stop, setStop] = useState<Stop | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const stopIDRef = useRef<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const fetchAndUpdateArrivals = useCallback(async (id: string, signal: AbortSignal) => {
        try {
            const fetched = await fetchArrivals(id, signal);
            setArrivals(fetched);
            setLastUpdated(new Date());
            setError(null);
        } catch (err: unknown) {
            if (isAbortError(err)) {
                return;
            }
            console.error("Failed to refresh arrivals:", err);
        }
    }, []);

    const startTimer = useCallback(
        (id: string, signal: AbortSignal) => {
            clearTimer();
            timerRef.current = window.setInterval(() => {
                void fetchAndUpdateArrivals(id, signal);
            }, REFRESH_INTERVAL * 1000);
        },
        [clearTimer, fetchAndUpdateArrivals],
    );

    useEffect(() => {
        if (stopID === undefined) {
            return;
        }

        const id = stopID;
        stopIDRef.current = id;

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const { signal } = controller;

        async function init() {
            setIsLoading(true);
            try {
                const [fetchedStop, fetchedArrivals] = await Promise.all([
                    fetchStop(id, signal),
                    fetchArrivals(id, signal),
                ]);
                setStop(fetchedStop);
                setArrivals(fetchedArrivals);
                setLastUpdated(new Date());
                setError(null);
                startTimer(id, signal);
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
        }

        void init();

        return () => {
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            clearTimer();
        };
    }, [stopID, clearTimer, startTimer]);

    const refresh = useCallback(() => {
        const id = stopIDRef.current;
        if (id === null) {
            return;
        }

        clearTimer();
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        startRefreshTransition(async () => {
            await fetchAndUpdateArrivals(id, controller.signal);
            startTimer(id, controller.signal);
        });
    }, [clearTimer, fetchAndUpdateArrivals, startRefreshTransition, startTimer]);

    return {
        arrivals: arrivals,
        error: error,
        isLoading: isLoading,
        isRefreshing: isRefreshing,
        lastUpdated: lastUpdated,
        refresh: refresh,
        stop: stop,
    };
}
