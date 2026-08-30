import { Search } from "lucide-solid";
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";

import { fetchStopsByQuery, type Stop } from "@/data/stops";
import { isAbortError } from "@/utils";

interface StopsSearchProps {
    onSelect: (stop: Stop) => void;
}

export default function StopsSearch(props: StopsSearchProps) {
    const [isLoading, setIsLoading] = createSignal<boolean>(false);
    const [isOpen, setIsOpen] = createSignal<boolean>(false);
    const [query, setQuery] = createSignal<string>("");
    const [results, setResults] = createSignal<Stop[]>([]);

    let containerRef: HTMLDivElement | undefined;
    const resultsID = "stop-search-results";

    // close dropdown on outside click
    onMount(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef && !containerRef.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
    });

    createEffect(() => {
        const trimmed = query().trim();
        if (!trimmed) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        let controller: AbortController | undefined;
        const timer = window.setTimeout(async () => {
            controller = new AbortController();
            setIsLoading(true);
            try {
                const stops = await fetchStopsByQuery(trimmed, controller.signal);
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

        onCleanup(() => {
            clearTimeout(timer);
            controller?.abort();
        });
    });

    function handleSelect(stop: Stop) {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        props.onSelect(stop);
    }

    return (
        <div ref={containerRef} class="relative w-full sm:w-64">
            <div class="border-border bg-card flex items-center gap-2 rounded-lg border px-3 py-2 shadow-md">
                <Search class="text-muted-foreground h-4 w-4 shrink-0" />
                <input
                    id="stop-search"
                    type="text"
                    value={query()}
                    onInput={(e) => setQuery(e.currentTarget.value)}
                    onFocus={() => results().length > 0 && setIsOpen(true)}
                    onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
                    placeholder="Search stops…"
                    inputMode="search"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck={false}
                    role="combobox"
                    aria-label="Search bus stops"
                    aria-autocomplete="list"
                    aria-expanded={isOpen()}
                    aria-controls={resultsID}
                    class="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-base outline-none sm:text-sm"
                />
                <Show when={isLoading()}>
                    <div
                        class="border-primary h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-t-transparent"
                        role="status"
                        aria-label="Searching stops"
                    />
                </Show>
            </div>

            <Show when={isOpen() && results().length > 0}>
                <ul
                    id={resultsID}
                    role="listbox"
                    aria-label="Bus stop search results"
                    class="border-border bg-card absolute top-full left-0 z-50 mt-1 max-h-[min(24rem,calc(100dvh-5rem))] w-full overflow-y-auto rounded-lg border shadow-lg">
                    <For each={results()}>
                        {(stop) => (
                            <li>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={false}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelect(stop)}
                                    class="hover:bg-secondary text-foreground flex w-full flex-col px-3 py-3 text-left transition-colors sm:py-2">
                                    <span class="text-sm font-medium">{stop.name}</span>
                                    <span class="text-muted-foreground font-mono text-xs">
                                        Stop #{stop.id} · {stop.routeIDs.join(", ")}
                                    </span>
                                </button>
                            </li>
                        )}
                    </For>
                </ul>
            </Show>
        </div>
    );
}
