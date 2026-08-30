import { useLocation } from "@solidjs/router";
import type { ParentProps } from "solid-js";

import NavBar from "@/components/nav-bar";
import SEO from "@/components/seo";
import { ThemeProvider } from "@/hooks/theme-provider";

export default function MainLayout(props: ParentProps) {
    const location = useLocation();
    const isMap = () => location.pathname === "/stops";
    const isNotFound = () =>
        !isMap() &&
        location.pathname !== "/" &&
        !location.pathname.startsWith("/stops/") &&
        !location.pathname.startsWith("/routes/");

    return (
        <ThemeProvider>
            <SEO
                noIndex={isNotFound() || location.pathname.startsWith("/routes/")}
                title={isMap() ? "Pittsburgh Bus Stop Map" : undefined}
                description={
                    isMap()
                        ? "Find Pittsburgh bus stops and view routes throughout Allegheny County with Pittsburgh Bus Watch."
                        : undefined
                }
            />
            <div class="flex h-screen flex-col">
                <NavBar />
                <div class="min-h-0 flex-1">{props.children}</div>
            </div>
        </ThemeProvider>
    );
}
