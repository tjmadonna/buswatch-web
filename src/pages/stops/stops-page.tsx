import "maplibre-gl/dist/maplibre-gl.css";

import { useNavigate } from "@solidjs/router";
import { ArrowRight, BusFront, LocateFixed, MapPin, X } from "lucide-solid";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { Accessor } from "solid-js";
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { render } from "solid-js/web";
import * as z from "zod/mini";

import { APIError } from "@/data";
import { type Bounds, fetchStopsByBounds, type Stop } from "@/data/stops";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTheme } from "@/hooks/use-theme";
import { useUserLocation } from "@/hooks/use-user-location";
import StopsSearch from "@/pages/stops/stops-search";
import { cls, isAbortError } from "@/utils";

maplibregl.setWorkerUrl(workerUrl);

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

function StopMarkerButton(props: { stop: Stop; isSelected: Accessor<boolean>; onSelect: (stop: Stop) => void }) {
    return (
        <button
            type="button"
            aria-label={props.stop.name}
            title={props.stop.name}
            onClick={(e) => {
                e.stopPropagation();
                props.onSelect(props.stop);
            }}
            class={cls(
                "cursor-pointer drop-shadow-md transition-transform hover:scale-110 focus:outline-none",
                props.isSelected() ? "text-primary/80 scale-110" : "text-primary",
            )}>
            <div class="relative">
                <MapPin class="h-10 w-10 fill-current stroke-none [&_circle]:hidden" />
                <BusFront class="stroke-primary-foreground absolute top-2 left-1/2 h-5 w-5 -translate-x-1/2" />
            </div>
        </button>
    );
}

function StopPopupContent(props: { stop: Stop; onClose: () => void; onViewArrivals: () => void }) {
    return (
        <div
            class="bg-card text-foreground w-56 rounded-lg p-3"
            role="presentation"
            onClick={(e) => e.stopPropagation()}>
            <div class="mb-2 flex items-start justify-between gap-2">
                <div>
                    <p class="text-foreground text-sm leading-tight font-semibold">{props.stop.name}</p>
                    <p class="text-muted-foreground mt-0.5 font-mono text-xs">Stop #{props.stop.id}</p>
                </div>
                <button
                    type="button"
                    onClick={() => props.onClose()}
                    class="text-muted-foreground hover:text-foreground hover:bg-secondary -mt-0.5 -mr-1 shrink-0 rounded-md p-2.5 transition-colors focus:outline-none sm:p-1.5"
                    aria-label="Close">
                    <X class="h-4 w-4" />
                </button>
            </div>
            <Show when={props.stop.routeIDs.length > 0}>
                <div class="mb-3 flex flex-wrap gap-1">
                    <For each={props.stop.routeIDs}>
                        {(id) => (
                            <span class="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                                {id}
                            </span>
                        )}
                    </For>
                </div>
            </Show>
            <button
                type="button"
                onClick={() => props.onViewArrivals()}
                class="bg-primary text-primary-foreground hover:bg-primary/80 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sm:py-1.5">
                View arrivals
                <ArrowRight class="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export default function StopsPage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [savedState, setSavedState] = useLocalStorage("stopsPageState", mapStateSchema, DEFAULT_STATE);
    const { userLocation, isLocating, locationError, locateUser } = useUserLocation();

    const [error, setError] = createSignal<APIError | null>(null);
    const [selectedStop, setSelectedStop] = createSignal<Stop | null>(null);
    const [stops, setStops] = createSignal<Stop[]>([]);
    const [zoom, setZoom] = createSignal<number>(savedState().zoom);

    const mapStyle = () => (theme() === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT);

    let mapContainer: HTMLDivElement | undefined;
    let map: maplibregl.Map | undefined;
    let userMarker: maplibregl.Marker | undefined;
    const stopMarkers = new Map<string, { marker: maplibregl.Marker; dispose: () => void }>();

    let abortController: AbortController | undefined;
    let debounceTimer: number | undefined;

    function loadStops(bounds: Bounds, currentZoom: number) {
        if (currentZoom < MIN_ZOOM) {
            setStops([]);
            return;
        }
        // debounce so rapid panning doesn't fire many requests
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = window.setTimeout(async () => {
            abortController?.abort();
            abortController = new AbortController();

            try {
                const data = await fetchStopsByBounds(bounds, abortController.signal);
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
    }

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer!,
            style: mapStyle(),
            center: [savedState().longitude, savedState().latitude],
            zoom: savedState().zoom,
        });

        map.on("click", () => setSelectedStop(null));

        map.on("moveend", () => {
            if (!map) return;
            const currentZoom = map.getZoom();
            const { lng, lat } = map.getCenter();
            setSavedState({ longitude: lng, latitude: lat, zoom: currentZoom });
            setZoom(currentZoom);
            const b = map.getBounds();
            loadStops({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() }, currentZoom);
        });

        map.on("load", () => {
            if (!map) return;
            const currentZoom = map.getZoom();
            setZoom(currentZoom);
            const b = map.getBounds();
            loadStops({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() }, currentZoom);
        });

        onCleanup(() => {
            abortController?.abort();
            if (debounceTimer) clearTimeout(debounceTimer);
            for (const { marker, dispose } of stopMarkers.values()) {
                dispose();
                marker.remove();
            }
            stopMarkers.clear();
            userMarker?.remove();
            map?.remove();
        });
    });

    // keep map style in sync with theme after initial creation
    let isFirstStyleSync = true;
    createEffect(() => {
        const style = mapStyle();
        if (isFirstStyleSync) {
            isFirstStyleSync = false;
            return;
        }
        map?.setStyle(style);
    });

    // ease to the user's location whenever it updates
    createEffect(() => {
        const loc = userLocation();
        if (loc && map) {
            map.easeTo({
                center: [loc.longitude, loc.latitude],
                zoom: Math.max(map.getZoom(), MIN_ZOOM),
                duration: 800,
                essential: true,
            });
        }
    });

    // sync the user-location marker
    createEffect(() => {
        const loc = userLocation();
        if (!map) return;

        if (loc) {
            if (!userMarker) {
                const el = document.createElement("div");
                el.className = "relative flex h-5 w-5 items-center justify-center";
                el.setAttribute("aria-label", "Your location");
                el.innerHTML =
                    '<span class="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"></span>' +
                    '<span class="bg-primary relative inline-flex h-3 w-3 rounded-full ring-2 ring-white"></span>';
                userMarker = new maplibregl.Marker({ element: el, anchor: "center" })
                    .setLngLat([loc.longitude, loc.latitude])
                    .addTo(map);
            } else {
                userMarker.setLngLat([loc.longitude, loc.latitude]);
            }
        } else {
            userMarker?.remove();
            userMarker = undefined;
        }
    });

    // sync stop markers with the stops signal
    createEffect(() => {
        if (!map) return;
        const currentStops = stops();
        const currentIDs = new Set(currentStops.map((s) => s.id));

        for (const [id, entry] of stopMarkers) {
            if (!currentIDs.has(id)) {
                entry.dispose();
                entry.marker.remove();
                stopMarkers.delete(id);
            }
        }

        for (const stop of currentStops) {
            if (stopMarkers.has(stop.id)) {
                continue;
            }
            const el = document.createElement("div");
            const dispose = render(
                () => (
                    <StopMarkerButton
                        stop={stop}
                        isSelected={() => selectedStop()?.id === stop.id}
                        onSelect={(s) => {
                            setSelectedStop(s);
                            setTimeout(() => {
                                map?.easeTo({ center: [s.longitude, s.latitude], duration: 600, essential: true });
                            }, 0);
                        }}
                    />
                ),
                el,
            );
            const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
                .setLngLat([stop.longitude, stop.latitude])
                .addTo(map);
            stopMarkers.set(stop.id, { marker, dispose });
        }
    });

    // sync the selected-stop popup
    createEffect(() => {
        const stop = selectedStop();
        if (!stop || !map) return;

        const el = document.createElement("div");
        const dispose = render(
            () => (
                <StopPopupContent
                    stop={stop}
                    onClose={() => setSelectedStop(null)}
                    onViewArrivals={() => navigate(`/stops/${encodeURIComponent(stop.id)}/arrivals`)}
                />
            ),
            el,
        );

        const popup = new maplibregl.Popup({
            anchor: "bottom",
            offset: 50,
            closeButton: false,
            className:
                "[&_.maplibregl-popup-tip]:border-t-card [&_.maplibregl-popup-content]:bg-card [&_.maplibregl-popup-content]:rounded-lg [&_.maplibregl-popup-content]:border-0 [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:shadow-lg",
        })
            .setLngLat([stop.longitude, stop.latitude])
            .setDOMContent(el)
            .addTo(map);

        popup.on("close", () => setSelectedStop(null));

        onCleanup(() => {
            dispose();
            popup.remove();
        });
    });

    return (
        <div class="relative h-full w-full">
            <div ref={mapContainer} class="absolute! inset-0" />

            <button
                type="button"
                onClick={locateUser}
                disabled={isLocating()}
                aria-label="Go to my location"
                class="border-border bg-card text-foreground hover:bg-secondary absolute right-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-md transition-colors disabled:opacity-50 sm:h-9 sm:w-9">
                <LocateFixed class={cls("h-5 w-5 sm:h-4 sm:w-4", isLocating() && "animate-pulse")} />
            </button>

            <div class="absolute top-4 right-4 left-4 z-10 sm:right-auto">
                <StopsSearch
                    onSelect={(stop) => {
                        setSelectedStop(null);
                        if (!map) return;
                        map.easeTo({
                            center: [stop.longitude, stop.latitude],
                            zoom: Math.max(map.getZoom(), MIN_ZOOM),
                            duration: 800,
                            essential: true,
                        });

                        setTimeout(() => {
                            setSelectedStop(stop);
                        }, 1000);
                    }}
                />
            </div>

            <Show when={locationError()}>
                <div class="bg-destructive text-destructive-foreground absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-md">
                    {locationError()}
                </div>
            </Show>

            <Show when={zoom() < MIN_ZOOM}>
                <div class="bg-card/90 text-muted-foreground border-border absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-md backdrop-blur-sm">
                    Zoom in to see bus stops
                </div>
            </Show>

            <Show when={error() && zoom() >= MIN_ZOOM}>
                <div class="bg-destructive text-destructive-foreground absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-md">
                    Failed to load stops
                </div>
            </Show>
        </div>
    );
}
