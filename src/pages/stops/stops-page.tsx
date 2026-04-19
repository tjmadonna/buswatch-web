import { APIError } from "@/data";
import { fetchStopsByBounds, type Bounds, type Stop } from "@/data/stops";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTheme } from "@/hooks/use-theme";
import StopSearch from "@/pages/stops/stop-search";
import { cls, isAbortError } from "@/utils";
import { ArrowRight, Bus, X } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Map, Marker, Popup, type MapRef } from "react-map-gl/maplibre";
import { useNavigate } from "react-router";
import * as z from "zod/mini";

const MAP_STYLE_LIGHT = "/positron.json";
const MAP_STYLE_DARK = "/dark.json";
const MIN_ZOOM = 13;

const DEFAULT_STATE = {
    longitude: -79.9959,
    latitude: 40.4406,
    zoom: 14,
};

const mapStateSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    zoom: z.number(),
});

export default function StopsPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [savedState, setSavedState] = useLocalStorage("stopsPageState", mapStateSchema, DEFAULT_STATE);

    const [stops, setStops] = useState<Stop[]>([]);
    const [error, setError] = useState<APIError | null>(null);
    const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
    const [zoom, setZoom] = useState<number>(savedState.zoom);

    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<number | null>(null);
    const mapRef = useRef<MapRef | null>(null);

    const mapStyle = theme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;

    const loadStops = useCallback((bounds: Bounds, currentZoom: number) => {
        if (currentZoom < MIN_ZOOM) {
            setStops([]);
            return;
        }
        // debounce so rapid panning doesn't fire many requests
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = window.setTimeout(async () => {
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();

            try {
                const data = await fetchStopsByBounds(bounds, abortControllerRef.current.signal);
                setStops(data);
                setError(null);
            } catch (err: unknown) {
                if (isAbortError(err)) {
                    return;
                }
                if (err instanceof APIError) {
                    setError(err);
                } else {
                    setError(new APIError(500, "Failed to load stops"));
                }
            }
        }, 300);
    }, []);

    // Load stops for the initial view on mount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="relative h-full w-full">
            <div className="absolute inset-0 [&>div]:h-full [&>div]:w-full">
                <Map
                    ref={mapRef}
                    initialViewState={savedState}
                    mapStyle={mapStyle}
                    onClick={() => setSelectedStop(null)}
                    onMoveEnd={(e) => {
                        const zoom = e.target.getZoom();
                        const { lng, lat } = e.target.getCenter();
                        setSavedState({ longitude: lng, latitude: lat, zoom });
                        setZoom(zoom);
                        const b = e.target.getBounds();
                        loadStops(
                            {
                                north: b.getNorth(),
                                south: b.getSouth(),
                                east: b.getEast(),
                                west: b.getWest(),
                            },
                            zoom,
                        );
                    }}
                    onLoad={(e) => {
                        const zoom = e.target.getZoom();
                        setZoom(zoom);
                        const b = e.target.getBounds();
                        loadStops(
                            {
                                north: b.getNorth(),
                                south: b.getSouth(),
                                east: b.getEast(),
                                west: b.getWest(),
                            },
                            zoom,
                        );
                    }}>
                    {stops.map((stop) => (
                        <Marker key={stop.id} longitude={stop.longitude} latitude={stop.latitude} anchor="center">
                            <button
                                type="button"
                                aria-label={stop.name}
                                title={stop.name}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStop(stop);
                                    setTimeout(() => {
                                        mapRef.current?.getMap().easeTo({
                                            center: [stop.longitude, stop.latitude],
                                            duration: 600,
                                            essential: true,
                                        });
                                    }, 0);
                                }}
                                className={cls(
                                    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full shadow-md transition-transform hover:scale-110 focus:outline-none sm:h-8 sm:w-8",
                                    selectedStop?.id === stop.id
                                        ? "bg-primary/80 text-primary-foreground scale-110"
                                        : "bg-primary text-primary-foreground hover:bg-primary/80",
                                )}>
                                <Bus className="h-5 w-5 sm:h-4 sm:w-4" />
                            </button>
                        </Marker>
                    ))}

                    {selectedStop && (
                        <Popup
                            longitude={selectedStop.longitude}
                            latitude={selectedStop.latitude}
                            anchor="bottom"
                            offset={20}
                            closeButton={false}
                            onClose={() => setSelectedStop(null)}
                            className="[&_.maplibregl-popup-tip]:border-t-card [&_.maplibregl-popup-content]:bg-card [&_.maplibregl-popup-content]:rounded-lg [&_.maplibregl-popup-content]:border-0 [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:shadow-lg">
                            <div
                                className="bg-card text-foreground w-56 rounded-lg p-3"
                                onClick={(e) => e.stopPropagation()}>
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-foreground text-sm leading-tight font-semibold">
                                            {selectedStop.name}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                                            Stop #{selectedStop.id}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStop(null)}
                                        className="text-muted-foreground hover:text-foreground hover:bg-secondary -mt-0.5 -mr-1 shrink-0 rounded-md p-2.5 transition-colors focus:outline-none sm:p-1.5"
                                        aria-label="Close">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                {selectedStop.routeIDs.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1">
                                        {selectedStop.routeIDs.map((id) => (
                                            <span
                                                key={id}
                                                className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                                                {id}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() =>
                                        void navigate(`/stops/${encodeURIComponent(selectedStop.id)}/arrivals`)
                                    }
                                    className="bg-primary text-primary-foreground hover:bg-primary/80 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sm:py-1.5">
                                    View arrivals
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>

            <div className="absolute top-4 right-4 left-4 z-10 sm:right-auto">
                <StopSearch
                    onSelect={(stop) => {
                        setSelectedStop(stop);
                        mapRef.current?.getMap().easeTo({
                            center: [stop.longitude, stop.latitude],
                            zoom: Math.max(mapRef.current.getMap().getZoom(), MIN_ZOOM),
                            duration: 800,
                        });
                    }}
                />
            </div>

            {zoom < MIN_ZOOM && (
                <div className="bg-card/90 text-muted-foreground border-border absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-md backdrop-blur-sm">
                    Zoom in to see bus stops
                </div>
            )}

            {error && zoom >= MIN_ZOOM && (
                <div className="bg-destructive text-destructive-foreground absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-md">
                    Failed to load stops
                </div>
            )}
        </div>
    );
}
