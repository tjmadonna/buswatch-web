import "maplibre-gl/dist/maplibre-gl.css";

import { Bus, BusFront, ChevronUp, LocateFixed, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Map, type MapRef, Marker, Source } from "react-map-gl/maplibre";
import { useLocation, useParams } from "react-router";
import * as z from "zod/mini";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTheme } from "@/hooks/use-theme";
import { useUserLocation } from "@/hooks/use-user-location";
import { routeColors } from "@/utils/color";

import { useShapesData } from "./use-vehicles-data";

const MAP_STYLE_LIGHT = "/positron.json";
const MAP_STYLE_DARK = "/dark.json";

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

export default function VehiclesPage() {
    const params = useParams<{ routeID: string }>();
    const location = useLocation();
    const { theme } = useTheme();
    const [savedState, setSavedState] = useLocalStorage("vehiclesPageState", mapStateSchema, DEFAULT_STATE);
    const { error, path, vehicles } = useShapesData(params.routeID);
    const { userLocation, isLocating, locationError, locateUser } = useUserLocation();

    const navState = navStateSchema.safeParse(location.state);
    const initialViewState = navState.success
        ? { latitude: navState.data.latitude, longitude: navState.data.longitude, zoom: 16 }
        : savedState;

    const mapRef = useRef<MapRef | null>(null);
    const [showLabel, setShowLabel] = useState(true);

    const mapStyle = theme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
    const routeID = params.routeID ?? "";

    const routeGeoJSON = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
        if (!path) return null;
        return {
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: [...path].sort((a, b) => a.sequence - b.sequence).map((s) => [s.longitude, s.latitude]),
            },
        };
    }, [path]);

    useEffect(() => {
        if (userLocation && mapRef.current) {
            mapRef.current.getMap().easeTo({
                center: [userLocation.longitude, userLocation.latitude],
                zoom: mapRef.current.getMap().getZoom(),
                duration: 800,
                essential: true,
            });
        }
    }, [userLocation]);

    return (
        <div className="relative h-full w-full">
            <div className="absolute inset-0 [&>div]:h-full [&>div]:w-full">
                <Map
                    ref={mapRef}
                    initialViewState={initialViewState}
                    mapStyle={mapStyle}
                    onMoveEnd={(e) => {
                        const zoom = e.target.getZoom();
                        const { lng, lat } = e.target.getCenter();
                        setSavedState({ longitude: lng, latitude: lat, zoom });
                    }}>
                    {navState.success && (
                        <Marker longitude={navState.data.longitude} latitude={navState.data.latitude} anchor="bottom">
                            <div className="text-primary drop-shadow-md" aria-label="Bus stop">
                                <div className="relative">
                                    <MapPin className="h-10 w-10 fill-current stroke-none [&_circle]:hidden" />
                                    <BusFront className="stroke-primary-foreground absolute top-2 left-1/2 h-5 w-5 -translate-x-1/2" />
                                </div>
                            </div>
                        </Marker>
                    )}
                    {userLocation && (
                        <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
                            <div
                                className="relative flex h-5 w-5 items-center justify-center"
                                aria-label="Your location">
                                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" />
                                <span className="bg-primary relative inline-flex h-3 w-3 rounded-full ring-2 ring-white" />
                            </div>
                        </Marker>
                    )}
                    {vehicles?.map((vehicle) => (
                        <Marker
                            key={vehicle.id}
                            longitude={vehicle.longitude}
                            latitude={vehicle.latitude}
                            anchor="center">
                            <div className="relative h-8 w-8" style={{ transform: `rotate(${vehicle.heading}deg)` }}>
                                <ChevronUp
                                    className="text-foreground absolute -top-6 left-1/2 h-8 w-8 -translate-x-1/2 drop-shadow-sm"
                                    style={{ strokeWidth: 3.5 }}
                                />
                                <div
                                    className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full shadow-md"
                                    style={{ transform: `rotate(${-vehicle.heading}deg)` }}
                                    aria-label={`Bus ${vehicle.tripName}`}>
                                    <Bus className="h-5 w-5" />
                                </div>
                            </div>
                        </Marker>
                    ))}
                    {routeGeoJSON && (
                        <Source id="route-path" type="geojson" data={routeGeoJSON}>
                            <Layer
                                id="route-path-line"
                                type="line"
                                paint={{
                                    "line-color": routeColors[routeID] ?? "var(--color-primary)",
                                    "line-width": 4,
                                    "line-opacity": 0.85,
                                }}
                                layout={{
                                    "line-join": "round",
                                    "line-cap": "round",
                                }}
                            />
                        </Source>
                    )}
                </Map>
            </div>

            {showLabel && (
                <div className="border-border bg-card text-foreground absolute top-4 left-1/2 z-10 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center rounded-full border px-4 py-2 shadow-md">
                    <span className="text-sm font-semibold">Route {params.routeID}</span>
                    {navState.success && (
                        <span className="text-muted-foreground ml-0 text-sm before:mx-2 before:content-['·']">
                            {navState.data.stopName}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowLabel(false)}
                        aria-label="Dismiss"
                        className="text-muted-foreground hover:text-foreground -mr-1 ml-4 rounded-full p-0.5 transition-colors focus:outline-none">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            <button
                type="button"
                onClick={locateUser}
                disabled={isLocating}
                aria-label="Go to my location"
                className="border-border bg-card text-foreground hover:bg-secondary absolute right-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-md transition-colors disabled:opacity-50 sm:h-9 sm:w-9">
                <LocateFixed className={`h-5 w-5 sm:h-4 sm:w-4 ${isLocating ? "animate-pulse" : ""}`} />
            </button>

            {locationError && (
                <div className="bg-destructive text-destructive-foreground absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-md">
                    {locationError}
                </div>
            )}

            {error && (
                <div className="bg-destructive text-destructive-foreground absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm shadow-md">
                    {error.status === 404 ? "Route not found" : "Failed to load route"}
                </div>
            )}
        </div>
    );
}
