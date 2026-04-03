import { APIError } from "@/data";
import { fetchArrivals, type Arrival } from "@/data/arrivals";
import { fetchStop, type Stop } from "@/data/stops";
import { isAbortError } from "@/utils";
import { useCallback, useEffect, useRef, useState } from "react";

export const REFRESH_INTERVAL = 15; // seconds

export function useArrivalsData(stopID?: string) {
    const [arrivals, setArrivals] = useState<Arrival[] | null>(null);
    const [error, setError] = useState<APIError | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [stop, setStop] = useState<Stop | null>(null);

    const timerRef = useRef<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const clearRefreshTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const setFetchError = useCallback((err: unknown) => {
        if (err instanceof APIError) {
            setError(err);
            return;
        }
        setError(new APIError(500, ""));
    }, []);

    const fetchAndStoreArrivals = useCallback(
        async (id: string, signal?: AbortSignal, clearArrivalsOnError = false) => {
            setIsLoading(true);
            try {
                const fetched = await fetchArrivals(id, signal);
                setArrivals(fetched);
                setLastUpdated(new Date());
                setError(null);
            } catch (err: unknown) {
                if (isAbortError(err)) {
                    return;
                }
                if (clearArrivalsOnError) {
                    setArrivals(null);
                }
                setFetchError(err);
            } finally {
                setIsLoading(false);
            }
        },
        [setFetchError],
    );

    const startRefreshTimer = useCallback(
        (id: string) => {
            clearRefreshTimer();
            timerRef.current = window.setInterval(() => {
                void fetchAndStoreArrivals(id, abortControllerRef.current?.signal, true);
            }, REFRESH_INTERVAL * 1000);
        },
        [clearRefreshTimer, fetchAndStoreArrivals],
    );

    useEffect(() => {
        if (!stopID) {
            clearRefreshTimer();
            abortControllerRef.current?.abort();
            return;
        }

        clearRefreshTimer();
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        void (async () => {
            setIsLoading(true);
            try {
                const [s, fetched] = await Promise.all([fetchStop(stopID, signal), fetchArrivals(stopID, signal)]);
                setStop(s);
                setArrivals(fetched);
                setLastUpdated(new Date());
                setError(null);
                startRefreshTimer(stopID);
            } catch (err: unknown) {
                if (isAbortError(err)) {
                    return;
                }
                setStop(null);
                setArrivals(null);
                setFetchError(err);
            } finally {
                setIsLoading(false);
            }
        })();

        return () => {
            clearRefreshTimer();
            abortControllerRef.current?.abort();
        };
    }, [clearRefreshTimer, setFetchError, startRefreshTimer, stopID]);

    const refresh = useCallback(async () => {
        if (!stopID) return;

        if (!abortControllerRef.current) {
            abortControllerRef.current = new AbortController();
        }

        await fetchAndStoreArrivals(stopID, abortControllerRef.current.signal, true);
        startRefreshTimer(stopID);
    }, [fetchAndStoreArrivals, startRefreshTimer, stopID]);

    return {
        arrivals: arrivals,
        error: error,
        isLoading: isLoading,
        lastUpdated: lastUpdated,
        refresh: refresh,
        stop: stop,
    };
}
