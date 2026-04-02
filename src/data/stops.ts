import { apiBase, APIError } from "@/data";
import * as z from "zod/mini";

const stopSchema = z.object({
    id: z.string(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    routeIDs: z.array(z.string()),
});

const stopResponseSchema = z.object({
    stop: stopSchema,
});

export type Stop = z.infer<typeof stopSchema>;

export async function fetchStop(stopId: string, signal?: AbortSignal): Promise<Stop> {
    const res = await fetch(`${apiBase}/api/v1/stops/${encodeURIComponent(stopId)}`, { signal });
    if (!res.ok) {
        throw new APIError(res.status, res.statusText);
    }
    const data: unknown = await res.json();
    const parsed = stopResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new APIError(500, "Invalid response format");
    }
    return parsed.data.stop;
}

export interface Bounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

const stopsResponseSchema = z.object({
    stops: z.array(stopSchema),
});

export async function fetchStopsByBounds(bounds: Bounds, signal?: AbortSignal): Promise<Stop[]> {
    const params = new URLSearchParams({
        north: bounds.north.toString(),
        south: bounds.south.toString(),
        east: bounds.east.toString(),
        west: bounds.west.toString(),
    });
    const res = await fetch(`${apiBase}/api/v1/stops?${params}`, { signal });
    if (!res.ok) {
        throw new APIError(res.status, res.statusText);
    }
    const data: unknown = await res.json();
    const parsed = stopsResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new APIError(500, "Invalid response format");
    }
    return parsed.data.stops;
}

export async function fetchStopsByQuery(query: string, signal?: AbortSignal): Promise<Stop[]> {
    const params = new URLSearchParams({ q: query });
    const res = await fetch(`${apiBase}/api/v1/stops?${params}`, { signal });
    if (!res.ok) {
        throw new APIError(res.status, res.statusText);
    }
    const data: unknown = await res.json();
    const parsed = stopsResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new APIError(500, "Invalid response format");
    }
    return parsed.data.stops;
}
