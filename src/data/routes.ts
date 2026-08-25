import * as z from "zod/mini";

import { apiBase, APIError } from "@/data";

const vehicleSchema = z.object({
    id: z.string(),
    tripName: z.string(),
    direction: z.enum(["Inbound", "Outbound"]),
    routeID: z.string(),
    heading: z.number(),
    latitude: z.number(),
    longitude: z.number(),
    occupancy: z.union([z.literal(-1), z.literal(0), z.literal(1), z.literal(2)]),
});

const vehiclesResponseSchema = z.object({
    vehicles: z.array(vehicleSchema),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export async function fetchRouteVehicles(routeID: string, signal?: AbortSignal): Promise<Vehicle[]> {
    const res = await fetch(`${apiBase}/api/v1/routes/${encodeURIComponent(routeID)}/vehicles`, { signal: signal });
    if (!res.ok) {
        throw new APIError(res.status, res.statusText);
    }
    const data: unknown = await res.json();
    const parsed = vehiclesResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new APIError(500, "Invalid response format");
    }
    return parsed.data.vehicles;
}

const pathPointSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    sequence: z.number(),
});

const pathResponseSchema = z.object({
    path: z.array(pathPointSchema),
});

export type PathPoint = z.infer<typeof pathPointSchema>;

export async function fetchRoutePath(routeID: string, signal?: AbortSignal): Promise<PathPoint[]> {
    const res = await fetch(`${apiBase}/api/v1/routes/${encodeURIComponent(routeID)}/path`, { signal: signal });
    if (!res.ok) {
        throw new APIError(res.status, res.statusText);
    }
    const data: unknown = await res.json();
    const parsed = pathResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new APIError(500, "Invalid response format");
    }
    return parsed.data.path;
}
