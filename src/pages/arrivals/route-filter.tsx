import { Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface RouteFilterProps {
    onChange: (routes: string[]) => void;
    routeIDs: string[];
    selectedRoutes: string[];
}

export function RouteFilter({ onChange, routeIDs, selectedRoutes }: RouteFilterProps) {
    const [open, setOpen] = useState(false);

    const ref = useRef<HTMLDivElement>(null);

    const isFiltered = selectedRoutes.length > 0;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function toggle(id: string) {
        if (selectedRoutes.includes(id)) {
            onChange(selectedRoutes.filter((r) => r !== id));
        } else {
            onChange([...selectedRoutes, id]);
        }
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`border-border bg-card text-foreground hover:bg-secondary flex h-11 w-11 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9 ${isFiltered ? "border-primary text-primary" : ""}`}
                aria-label="Filter by route"
                aria-expanded={open}>
                <Filter className="h-4 w-4" />
                {isFiltered && (
                    <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
                        {selectedRoutes.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="border-border bg-card absolute right-0 z-10 mt-2 min-w-36 rounded-lg border p-1 shadow-lg">
                    <p className="text-muted-foreground px-2 py-1.5 text-xs font-semibold tracking-wider uppercase">
                        Routes
                    </p>
                    {routeIDs.map((id) => (
                        <label
                            key={id}
                            className="hover:bg-secondary flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-3 sm:py-1.5">
                            <input
                                type="checkbox"
                                checked={!selectedRoutes.includes(id)}
                                onChange={() => toggle(id)}
                                className="accent-primary h-4 w-4 cursor-pointer"
                            />
                            <span className="text-foreground text-sm">Route {id}</span>
                        </label>
                    ))}
                    {isFiltered && (
                        <>
                            <div className="border-border my-1 border-t" />
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="text-muted-foreground hover:bg-secondary w-full rounded-md px-2 py-3 text-left text-xs sm:py-1.5">
                                Clear filters
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
