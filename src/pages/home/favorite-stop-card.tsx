import { MapPin } from "lucide-react";
import { Link } from "react-router";

import { FavoriteToggle } from "@/components/favorite-toggle";
import type { Stop } from "@/data/stops";

interface FavoriteStopCardProps {
    stop: Stop;
}

export default function FavoriteStopCard({ stop }: FavoriteStopCardProps) {
    return (
        <div className="bg-card border-border hover:bg-secondary/50 flex flex-col gap-3 rounded-xl border p-4 transition-colors">
            <div className="flex items-start justify-between gap-2">
                <Link to={`/stops/${stop.id}/arrivals`} className="group flex min-w-0 flex-1 items-center gap-3">
                    <div className="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                        <MapPin className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="text-foreground truncate text-base font-semibold transition-colors">
                            {stop.name}
                        </span>
                        <span className="text-muted-foreground text-sm">Stop #{stop.id}</span>
                    </div>
                </Link>
                <FavoriteToggle stopID={stop.id} />
            </div>

            {stop.routeIDs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {stop.routeIDs.map((route) => (
                        <span
                            key={route}
                            className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold">
                            {route}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
