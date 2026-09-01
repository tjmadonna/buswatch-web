import { A } from "@solidjs/router";
import { Bus, Clock, Users } from "lucide-solid";
import { Index, Show } from "solid-js";

import { type OccupancyLevel } from "@/pages/arrivals/occupancy";
import { routeColors } from "@/utils/color";

const OCCUPANCY_BAR_COUNT = 3;

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

export default function BusArrivalCard(props: BusArrivalCardProps) {
    const arrivalMinutes = () => Math.round((props.arrivalTime.getTime() - props.currentTime.getTime()) / 60000);

    return (
        <A
            href={`/routes/${encodeURIComponent(props.routeID)}/vehicles`}
            state={{ latitude: props.stopLatitude, longitude: props.stopLongitude, stopName: props.stopName }}
            class="border-border bg-card hover:bg-secondary/50 flex items-center gap-4 rounded-lg border p-4 transition-colors">
            <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-bold text-white"
                style={{ "background-color": routeColors[props.routeID] ?? "var(--color-primary)" }}>
                <span class={props.routeID.length < 4 ? "text-lg" : "text-base"}>{props.routeID}</span>
            </div>

            <div class="flex min-w-0 flex-1 flex-col gap-1">
                <div class="flex items-center gap-2">
                    <Bus class="text-muted-foreground h-4 w-4 shrink-0" />
                    <span class="text-foreground truncate text-sm font-medium">{props.tripName}</span>
                </div>
                <OccupancyIndicator level={props.occupancy} />
            </div>

            <div class="flex shrink-0 flex-col items-end gap-1">
                <div class="flex items-center gap-1.5">
                    <Show when={arrivalMinutes() <= 2}>
                        <span class="bg-primary h-2 w-2 animate-pulse rounded-full" aria-label="Arriving soon" />
                    </Show>
                    <span class="text-foreground text-lg font-bold">{formatArrival(arrivalMinutes())}</span>
                </div>
                <div class="text-muted-foreground flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    <span class="text-xs">
                        {props.arrivalTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
            </div>
        </A>
    );
}

interface OccupancyIndicatorProps {
    level: OccupancyLevel;
}

function OccupancyIndicator(props: OccupancyIndicatorProps) {
    const config = () => occupancyConfig[props.level];

    return (
        <div class="flex items-center gap-2">
            <Users class="h-4 w-4" />
            <div class="flex gap-0.5" aria-hidden="true">
                <Index each={Array.from({ length: OCCUPANCY_BAR_COUNT })}>
                    {(_, i) => (
                        <div class={`h-3 w-1.5 rounded-sm ${i < config().bars ? config().class : "bg-secondary"}`} />
                    )}
                </Index>
            </div>
            <span class="text-xs">{config().label}</span>
        </div>
    );
}
