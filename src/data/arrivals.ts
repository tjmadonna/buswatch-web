import { apiBase, APIError } from "@/data";
import * as z from "zod/mini";

const arrivalSchema = z.object({
    arrival_time: z.pipe(
        z.iso.datetime(),
        z.transform((d) => new Date(d)),
    ),
    occupancy: z.union([z.literal(-1), z.literal(0), z.literal(1), z.literal(2)]),
    direction: z.enum(["Inbound", "Outbound"]),
    routeID: z.string(),
    tripName: z.string(),
    vehicleID: z.string(),
});

const arrivalsResponseSchema = z.object({
    arrivals: z.array(arrivalSchema),
});

export type Arrival = z.infer<typeof arrivalSchema>;

export async function fetchArrivals(stopId: string, signal?: AbortSignal): Promise<Arrival[]> {
    const res = await fetch(`${apiBase}/api/v1/stops/${encodeURIComponent(stopId)}/arrivals`, { signal });
    if (!res.ok) {
        throw new APIError(res.status, res.statusText);
    }
    const data: unknown = await res.json();
    const parsed = arrivalsResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new APIError(500, "Invalid response format");
    }
    return parsed.data.arrivals;
}
