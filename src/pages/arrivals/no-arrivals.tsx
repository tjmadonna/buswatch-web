import { Clock } from "lucide-react";

export default function NoArrivals() {
    return (
        <div className="border-border bg-card mt-4 flex flex-col items-center rounded-lg border border-dashed px-6 py-12 text-center">
            <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                <Clock className="text-muted-foreground h-7 w-7" />
            </div>

            <h3 className="text-foreground mb-1 text-base font-semibold">No arrivals available</h3>
            <p className="text-muted-foreground mb-6 max-w-xs text-sm">
                {
                    "There are no upcoming arrivals for this stop right now. This may be due to service hours ending or a temporary data outage."
                }
            </p>
        </div>
    );
}
