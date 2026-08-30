import "maplibre-gl/dist/maplibre-gl.css";

import { useLocation, useParams } from "@solidjs/router";
import type { Feature, LineString } from "geojson";
import { Bus, BusFront, ChevronUp, LocateFixed, MapPin, X } from "lucide-solid";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { Accessor } from "solid-js";
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { render } from "solid-js/web";
import * as z from "zod/mini";

import MAP_STYLE_DARK from "@/assets/dark.json?url";
import MAP_STYLE_LIGHT from "@/assets/positron.json?url";
import SEO from "@/components/seo";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTheme } from "@/hooks/use-theme";
import { useUserLocation } from "@/hooks/use-user-location";
import { routeColors } from "@/utils/color";

import { useShapesData } from "./use-vehicles-data";

maplibregl.setWorkerUrl(workerUrl);

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

const navStateSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    stopName: z.string(),
});

interface GeoJSONSourceLike {
    setData: (data: Feature<LineString>) => void;
}

function StopMarkerContent() {
    return (
        <div class="text-primary drop-shadow-md" aria-label="Bus stop">
            <div class="relative">
                <MapPin class="h-10 w-10 fill-current stroke-none [&_circle]:hidden" />
                <BusFront class="stroke-primary-foreground absolute top-2 left-1/2 h-5 w-5 -translate-x-1/2" />
            </div>
        </div>
    );
}

function UserLocationMarkerContent() {
    return (
        <div class="relative flex h-5 w-5 items-center justify-center" aria-label="Your location">
            <span class="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" />
            <span class="bg-primary relative inline-flex h-3 w-3 rounded-full ring-2 ring-white" />
        </div>
    );
}

function VehicleMarkerContent(props: { heading: Accessor<number>; tripName: Accessor<string> }) {
    return (
        <div class="relative h-8 w-8" style={{ transform: `rotate(${props.heading()}deg)` }}>
            <ChevronUp
                class="text-foreground absolute -top-6 left-1/2 h-8 w-8 -translate-x-1/2 drop-shadow-sm"
                style={{ "stroke-width": "3.5" }}
            />
            <div
                class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full shadow-md"
                style={{ transform: `rotate(${-props.heading()}deg)` }}
                aria-label={`Bus ${props.tripName()}`}>
                <Bus class="h-5 w-5" />
            </div>
        </div>
    );
}

export default function VehiclesPage() {
    const params = useParams<{ routeID: string }>();
    const location = useLocation();
    const { theme } = useTheme();
    const [savedState, setSavedState] = useLocalStorage("vehiclesPageState", mapStateSchema, DEFAULT_STATE);
    const { error, path, vehicles } = useShapesData(() => params.routeID);
    const { userLocation, isLocating, locationError, locateUser } = useUserLocation();

    const [showLabel, setShowLabel] = createSignal(true);

    const routeID = () => params.routeID ?? "";
    const mapStyle = () => (theme() === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT);
    const navState = createMemo(() => navStateSchema.safeParse(location.state));
    const navData = createMemo(() => {
        const result = navState();
        return result.success ? result.data : null;
    });

    const routeGeoJSON = createMemo<Feature<LineString> | null>(() => {
        const currentPath = path();
        if (!currentPath) return null;
        return {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: [...currentPath]
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((s) => [s.longitude, s.latitude]),
            },
        };
    });

    let mapContainer: HTMLDivElement | undefined;
    let map: maplibregl.Map | undefined;
    let stopMarker: { marker: maplibregl.Marker; dispose: () => void } | undefined;
    let userMarker: { marker: maplibregl.Marker; dispose: () => void } | undefined;
    const vehicleMarkers = new Map<
        string,
        {
            marker: maplibregl.Marker;
            setHeading: (n: number) => void;
            setTripName: (s: string) => void;
            dispose: () => void;
        }
    >();

    let hasLoadedOnce = false;

    function syncRouteLayer() {
        if (!map || !hasLoadedOnce) return;
        const geojson = routeGeoJSON();
        const source = map.getSource("route-path") as GeoJSONSourceLike | undefined;

        if (!geojson) {
            if (map.getLayer("route-path-line")) map.removeLayer("route-path-line");
            if (source) map.removeSource("route-path");
            return;
        }

        if (source) {
            source.setData(geojson);
        } else {
            map.addSource("route-path", { type: "geojson", data: geojson });
            map.addLayer({
                id: "route-path-line",
                type: "line",
                source: "route-path",
                paint: {
                    "line-color": routeColors[routeID()] ?? "var(--color-primary)",
                    "line-width": 4,
                    "line-opacity": 0.85,
                },
                layout: {
                    "line-join": "round",
                    "line-cap": "round",
                },
            });
        }
    }

    onMount(() => {
        const nav = navState();
        const initialViewState = nav.success
            ? { latitude: nav.data.latitude, longitude: nav.data.longitude, zoom: 16 }
            : savedState();

        map = new maplibregl.Map({
            container: mapContainer!,
            style: mapStyle(),
            center: [initialViewState.longitude, initialViewState.latitude],
            zoom: initialViewState.zoom,
        });

        map.on("moveend", () => {
            if (!map) return;
            const zoom = map.getZoom();
            const { lng, lat } = map.getCenter();
            setSavedState({ longitude: lng, latitude: lat, zoom });
        });

        // eslint-disable-next-line solid/reactivity
        map.on("load", () => {
            hasLoadedOnce = true;
            syncRouteLayer();
        });
        map.on("style.load", syncRouteLayer);

        onCleanup(() => {
            stopMarker?.dispose();
            stopMarker?.marker.remove();
            userMarker?.dispose();
            userMarker?.marker.remove();
            for (const entry of vehicleMarkers.values()) {
                entry.dispose();
                entry.marker.remove();
            }
            vehicleMarkers.clear();
            map?.remove();
        });
    });

    let isFirstStyleSync = true;
    createEffect(() => {
        const style = mapStyle();
        if (isFirstStyleSync) {
            isFirstStyleSync = false;
            return;
        }
        map?.setStyle(style);
    });

    createEffect(() => {
        const loc = userLocation();
        if (loc && map) {
            map.easeTo({
                center: [loc.longitude, loc.latitude],
                zoom: map.getZoom(),
                duration: 800,
                essential: true,
            });
        }
    });

    createEffect(() => {
        if (!map) return;
        const nav = navState();

        if (nav.success) {
            if (!stopMarker) {
                const el = document.createElement("div");
                const dispose = render(() => <StopMarkerContent />, el);
                const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
                    .setLngLat([nav.data.longitude, nav.data.latitude])
                    .addTo(map);
                stopMarker = { marker, dispose };
            } else {
                stopMarker.marker.setLngLat([nav.data.longitude, nav.data.latitude]);
            }
        } else if (stopMarker) {
            stopMarker.dispose();
            stopMarker.marker.remove();
            stopMarker = undefined;
        }
    });

    createEffect(() => {
        if (!map) return;
        const loc = userLocation();

        if (loc) {
            if (!userMarker) {
                const el = document.createElement("div");
                const dispose = render(() => <UserLocationMarkerContent />, el);
                const marker = new maplibregl.Marker({ element: el, anchor: "center" })
                    .setLngLat([loc.longitude, loc.latitude])
                    .addTo(map);
                userMarker = { marker, dispose };
            } else {
                userMarker.marker.setLngLat([loc.longitude, loc.latitude]);
            }
        } else if (userMarker) {
            userMarker.dispose();
            userMarker.marker.remove();
            userMarker = undefined;
        }
    });

    createEffect(() => {
        if (!map) return;
        const list = vehicles() ?? [];
        const currentIDs = new Set(list.map((v) => v.id));

        for (const [id, entry] of vehicleMarkers) {
            if (!currentIDs.has(id)) {
                entry.dispose();
                entry.marker.remove();
                vehicleMarkers.delete(id);
            }
        }

        for (const vehicle of list) {
            const entry = vehicleMarkers.get(vehicle.id);
            if (!entry) {
                const [heading, setHeading] = createSignal(vehicle.heading);
                const [tripName, setTripName] = createSignal(vehicle.tripName);
                const el = document.createElement("div");
                const dispose = render(() => <VehicleMarkerContent heading={heading} tripName={tripName} />, el);
                const marker = new maplibregl.Marker({ element: el, anchor: "center" })
                    .setLngLat([vehicle.longitude, vehicle.latitude])
                    .addTo(map);
                vehicleMarkers.set(vehicle.id, { marker, setHeading, setTripName, dispose });
            } else {
                entry.marker.setLngLat([vehicle.longitude, vehicle.latitude]);
                entry.setHeading(vehicle.heading);
                entry.setTripName(vehicle.tripName);
            }
        }
    });

    createEffect(syncRouteLayer);

    return (
        <div class="relative h-full w-full">
            <SEO title={`Route ${routeID()} Live Vehicles`} noIndex />
            <div ref={mapContainer} class="absolute! inset-0" />

            <Show when={showLabel()}>
                <div class="border-border bg-card text-foreground absolute top-4 left-1/2 z-10 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center rounded-full border px-4 py-2 shadow-md">
                    <span class="text-sm font-semibold">Route {routeID()}</span>
                    <Show when={navData()}>
                        {(data) => (
                            <span class="text-muted-foreground ml-0 text-sm before:mx-2 before:content-['·']">
                                {data().stopName}
                            </span>
                        )}
                    </Show>
                    <button
                        type="button"
                        onClick={() => setShowLabel(false)}
                        aria-label="Dismiss"
                        class="text-muted-foreground hover:text-foreground -mr-1 ml-4 rounded-full p-0.5 transition-colors focus:outline-none">
                        <X class="h-3.5 w-3.5" />
                    </button>
                </div>
            </Show>

            <button
                type="button"
                onClick={locateUser}
                disabled={isLocating()}
                aria-label="Go to my location"
                class="border-border bg-card text-foreground hover:bg-secondary absolute right-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-md transition-colors disabled:opacity-50 sm:h-9 sm:w-9">
                <LocateFixed class={`h-5 w-5 sm:h-4 sm:w-4 ${isLocating() ? "animate-pulse" : ""}`} />
            </button>

            <Show when={locationError()}>
                <div class="bg-destructive text-destructive-foreground absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-md">
                    {locationError()}
                </div>
            </Show>

            <Show when={error()}>
                <div class="bg-destructive text-destructive-foreground absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-md">
                    {error()?.status === 404 ? "Route not found" : "Failed to load route"}
                </div>
            </Show>
        </div>
    );
}
