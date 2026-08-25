import { Bus, Clock, Users } from "lucide-react";
import { Link } from "react-router";

import { type OccupancyLevel } from "@/pages/arrivals/occupancy";
import { routeColors } from "@/utils/color";

const occupancyConfig: Record<OccupancyLevel, { label: string; class: string; bars: number }> = {
    low: { label: "Seats available", class: "bg-occupancy-low", bars: 1 },
    medium: { label: "Standing room", class: "bg-occupancy-medium", bars: 2 },
    high: { label: "Full", class: "bg-occupancy-high", bars: 3 },
    unknown: { label: "No data", class: "", bars: 0 },
};

function formatArrival(minutes: number): string {
    if (minutes <= 0) return "Now";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
}

interface BusArrivalCardProps {
    arrivalTime: Date;
    currentTime: Date;
    occupancy: OccupancyLevel;
    routeID: string;
    stopLatitude: number;
    stopLongitude: number;
    stopName: string;
    tripName: string;
}

export default function BusArrivalCard({
    arrivalTime,
    currentTime,
    occupancy,
    routeID,
    stopLatitude,
    stopLongitude,
    stopName,
    tripName,
}: BusArrivalCardProps) {
    const arrivalMinutes = Math.round((arrivalTime.getTime() - currentTime.getTime()) / 60000);

    return (
        <Link
            to={`/routes/${encodeURIComponent(routeID)}/vehicles`}
            state={{ latitude: stopLatitude, longitude: stopLongitude, stopName }}
            className="border-border bg-card hover:bg-secondary/50 flex items-center gap-4 rounded-lg border p-4 transition-colors">
            <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-bold text-white"
                style={{ backgroundColor: routeColors[routeID] ?? "var(--color-primary)" }}>
                <span className="text-lg">{routeID}</span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Bus className="text-muted-foreground h-4 w-4 shrink-0" />
                    <span className="text-foreground truncate text-sm font-medium">{tripName}</span>
                </div>
                <OccupancyIndicator level={occupancy} />
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                    {arrivalMinutes <= 2 && (
                        <span className="bg-primary h-2 w-2 animate-pulse rounded-full" aria-label="Arriving soon" />
                    )}
                    <span className="text-foreground text-lg font-bold">{formatArrival(arrivalMinutes)}</span>
                </div>
                <div className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">
                        {arrivalTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>
        </Link>
    );
}

interface OccupancyIndicatorProps {
    level: OccupancyLevel;
}

function OccupancyIndicator({ level }: OccupancyIndicatorProps) {
    const config = occupancyConfig[level];
    const barClass = config.class;

    return (
        <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <div className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`h-3 w-1.5 rounded-sm ${i < config.bars ? barClass : "bg-secondary"}`} />
                ))}
            </div>
            <span className="text-xs">{config.label}</span>
        </div>
    );
}
