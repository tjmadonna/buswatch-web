import { MapPin } from "lucide-react";

interface BusStopHeaderProps {
    routes: string[];
    stopID: string;
    stopName: string;
}

export function BusStopHeader({ routes, stopID, stopName }: BusStopHeaderProps) {
    return (
        <header className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <MapPin className="text-primary h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <h1 className="text-foreground text-xl font-bold text-balance">{stopName}</h1>
                    <p className="text-muted-foreground text-sm">Stop #{stopID}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {routes.map((route) => (
                    <span
                        key={route}
                        className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold">
                        {route}
                    </span>
                ))}
            </div>
        </header>
    );
}
