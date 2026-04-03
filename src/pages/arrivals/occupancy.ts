export type OccupancyLevel = "low" | "medium" | "high" | "unknown";

export function parseOccupancy(occupancy: number): OccupancyLevel {
    switch (occupancy) {
        case 0:
            return "low";
        case 1:
            return "medium";
        case 2:
            return "high";
        default:
            return "unknown"; // unknown occupancy
    }
}
