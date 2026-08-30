import { A } from "@solidjs/router";
import { MapPin } from "lucide-solid";
import { For } from "solid-js";

interface BusStopHeaderProps {
    stopID: string;
    stopName: string;
}

export function BusStopHeader(props: BusStopHeaderProps) {
    return (
        <header class="flex items-start gap-3">
            <div class="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <MapPin class="text-primary h-5 w-5" />
            </div>
            <div class="flex flex-col gap-0.5">
                <h1 class="text-foreground text-xl font-bold text-balance">{props.stopName}</h1>
                <p class="text-muted-foreground text-sm">Stop #{props.stopID}</p>
            </div>
        </header>
    );
}

interface RouteBadgeListProps {
    routes: string[];
}

export function RouteBadgeList(props: RouteBadgeListProps) {
    return (
        <div class="flex flex-wrap gap-2">
            <For each={props.routes}>
                {(route) => (
                    <A
                        href={`/routes/${encodeURIComponent(route)}/vehicles`}
                        class="bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-primary inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2">
                        {route}
                    </A>
                )}
            </For>
        </div>
    );
}
