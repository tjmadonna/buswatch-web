import { Funnel } from "lucide-solid";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

interface RouteFilterProps {
    onChange: (routes: string[]) => void;
    routeIDs: string[];
    selectedRoutes: string[];
}

export function RouteFilter(props: RouteFilterProps) {
    const [open, setOpen] = createSignal(false);

    let containerRef: HTMLDivElement | undefined;
    const popupID = "route-filter-options";

    const isFiltered = () => props.selectedRoutes.length > 0;

    onMount(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef && !containerRef.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
    });

    function toggle(id: string) {
        if (props.selectedRoutes.includes(id)) {
            props.onChange(props.selectedRoutes.filter((r) => r !== id));
        } else {
            props.onChange([...props.selectedRoutes, id]);
        }
    }

    return (
        <div ref={containerRef} class="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                class={`border-border bg-card text-foreground hover:bg-secondary flex h-11 w-11 items-center justify-center rounded-md border transition-colors sm:h-9 sm:w-9 ${
                    isFiltered() ? "border-primary text-primary" : ""
                }`}
                aria-label="Filter by route"
                aria-expanded={open()}
                aria-controls={popupID}>
                <Funnel class="h-4 w-4" />
                <Show when={isFiltered()}>
                    <span class="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
                        {props.selectedRoutes.length}
                    </span>
                </Show>
            </button>

            <Show when={open()}>
                <div
                    id={popupID}
                    role="group"
                    aria-label="Route filters"
                    class="border-border bg-card absolute right-0 z-10 mt-2 min-w-36 rounded-lg border p-1 shadow-lg">
                    <p class="text-muted-foreground px-2 py-1.5 text-xs font-semibold tracking-wider uppercase">
                        Routes
                    </p>
                    <For each={props.routeIDs}>
                        {(id) => (
                            <label class="hover:bg-secondary flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-3 sm:py-1.5">
                                <input
                                    type="checkbox"
                                    checked={!props.selectedRoutes.includes(id)}
                                    onChange={() => toggle(id)}
                                    class="accent-primary h-4 w-4 cursor-pointer"
                                />
                                <span class="text-foreground text-sm">Route {id}</span>
                            </label>
                        )}
                    </For>
                    <Show when={isFiltered()}>
                        <div class="border-border my-1 border-t" />
                        <button
                            type="button"
                            onClick={() => props.onChange([])}
                            class="text-muted-foreground hover:bg-secondary w-full rounded-md px-2 py-3 text-left text-xs sm:py-1.5">
                            Clear filters
                        </button>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
