import { fetchStopsByQuery, type Stop } from "@/data/stops";
import { isAbortError } from "@/utils";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface StopSearchProps {
    onSelect: (stop: Stop) => void;
}

export default function StopSearch({ onSelect }: StopSearchProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<Stop[]>([]);

    const abortControllerRef = useRef<AbortController | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<number | null>(null);
    const resultsID = "stop-search-results";

    // close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = window.setTimeout(async () => {
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            setIsLoading(true);
            try {
                const stops = await fetchStopsByQuery(trimmed, abortControllerRef.current.signal);
                setResults(stops);
                setIsOpen(true);
            } catch (err) {
                if (isAbortError(err)) {
                    return;
                }
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            abortControllerRef.current?.abort();
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [query]);

    function handleSelect(stop: Stop) {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        onSelect(stop);
    }

    return (
        <div ref={containerRef} className="relative w-full sm:w-64">
            <div className="border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-2 shadow-md">
                <Search className="text-muted-foreground h-4 w-4 shrink-0" />
                <input
                    id="stop-search"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
                    placeholder="Search stops…"
                    inputMode="search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    role="combobox"
                    aria-label="Search bus stops"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-controls={resultsID}
                    className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-base outline-none sm:text-sm"
                />
                {isLoading && (
                    <div
                        className="border-primary h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-t-transparent"
                        role="status"
                        aria-label="Searching stops"
                    />
                )}
            </div>

            {isOpen && results.length > 0 && (
                <ul
                    id={resultsID}
                    role="listbox"
                    aria-label="Bus stop search results"
                    className="border-border bg-card absolute top-full left-0 z-50 mt-1 max-h-[min(24rem,calc(100dvh-5rem))] w-full overflow-y-auto rounded-lg border shadow-lg">
                    {results.map((stop) => (
                        <li key={stop.id}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={false}
                                onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                                onClick={() => handleSelect(stop)}
                                className="hover:bg-secondary text-foreground flex w-full flex-col px-3 py-3 text-left transition-colors sm:py-2">
                                <span className="text-sm font-medium">{stop.name}</span>
                                <span className="text-muted-foreground font-mono text-xs">
                                    Stop #{stop.id} · {stop.routeIDs.join(", ")}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
