import { A } from "@solidjs/router";
import { MapPin } from "lucide-solid";
import { For, Show } from "solid-js";

import { FavoriteToggle } from "@/components/favorite-toggle";
import type { Stop } from "@/data/stops";

interface FavoriteStopCardProps {
    stop: Stop;
}

export default function FavoriteStopCard(props: FavoriteStopCardProps) {
    return (
        <div class="bg-card border-border has-[a:hover]:bg-secondary/50 relative flex flex-col gap-3 rounded-xl border p-4 transition-colors">
            <div class="flex items-start justify-between gap-2">
                <A
                    href={`/stops/${props.stop.id}/arrivals`}
                    class="group flex min-w-0 flex-1 items-center gap-3 after:absolute after:inset-0 after:content-['']">
                    <div class="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <MapPin class="text-primary h-5 w-5" />
                    </div>
                    <div class="flex flex-col gap-0.5 overflow-hidden">
                        <span class="text-foreground truncate text-base font-semibold transition-colors">
                            {props.stop.name}
                        </span>
                        <span class="text-muted-foreground text-sm">Stop #{props.stop.id}</span>
                    </div>
                </A>
                <div class="relative z-10">
                    <FavoriteToggle stopID={props.stop.id} />
                </div>
            </div>

            <Show when={props.stop.routeIDs.length > 0}>
                <div class="flex flex-wrap gap-1.5">
                    <For each={props.stop.routeIDs}>
                        {(route) => (
                            <span class="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold">
                                {route}
                            </span>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}
