import { A, useLocation, useNavigate } from "@solidjs/router";
import { ChevronLeft, Map, Moon, Star, Sun } from "lucide-solid";
import { createMemo } from "solid-js";

import AppIcon from "@/components/app-icon";
import { useTheme } from "@/hooks/use-theme";

const LEAF_ROUTES = [/^\/stops\/[^/]+\/arrivals/, /^\/routes\/[^/]+\/vehicles/];

function navLinkClass(isActive: boolean) {
    return `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`;
}

export default function NavBar() {
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const isLeaf = createMemo(() => LEAF_ROUTES.some((r) => r.test(location.pathname)));

    return (
        <nav class="bg-card border-border flex h-14 shrink-0 items-center gap-1 border-b px-4">
            {isLeaf() ? (
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    class="text-muted-foreground hover:text-foreground hover:bg-secondary mr-2 -ml-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors md:hidden">
                    <ChevronLeft class="h-5 w-5" />
                    Back
                </button>
            ) : (
                <>
                    <AppIcon class="text-foreground mr-1 inline-block h-7 w-7 md:mr-2 md:hidden" />
                    <span class="text-foreground mr-4 block text-sm font-bold tracking-tight sm:text-base md:hidden">
                        Bus Watch
                    </span>
                </>
            )}
            <AppIcon class="text-foreground mr-1 hidden h-7 w-7 md:mr-2 md:inline-block" />
            <span class="text-foreground mr-4 hidden text-base font-bold tracking-tight md:block">
                Pittsburgh Bus Watch
            </span>
            <A href="/" end class={navLinkClass(location.pathname === "/")}>
                <Star class="h-4 w-4" />
                Home
            </A>
            <A href="/stops" end class={navLinkClass(location.pathname === "/stops")}>
                <Map class="h-4 w-4" />
                Map
            </A>
            <button
                type="button"
                onClick={toggle}
                aria-label={theme() === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                class="text-muted-foreground hover:text-foreground hover:bg-secondary ml-auto rounded-md p-2 transition-colors">
                {theme() === "dark" ? <Sun class="h-4 w-4" /> : <Moon class="h-4 w-4" />}
            </button>
        </nav>
    );
}
