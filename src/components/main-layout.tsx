import { Outlet, useLocation } from "react-router";

import NavBar from "@/components/nav-bar";
import SEO from "@/components/seo";
import { ThemeProvider } from "@/hooks/theme-provider";

export default function MainLayout() {
    const location = useLocation();
    const isMap = location.pathname === "/stops";
    const isNotFound =
        !isMap &&
        location.pathname !== "/" &&
        !location.pathname.startsWith("/stops/") &&
        !location.pathname.startsWith("/routes/");

    return (
        <ThemeProvider>
            <SEO
                noIndex={isNotFound || location.pathname.startsWith("/routes/")}
                title={isMap ? "Pittsburgh Bus Stop Map" : undefined}
                description={
                    isMap
                        ? "Find Pittsburgh bus stops and view routes throughout Allegheny County with Pittsburgh Bus Watch."
                        : undefined
                }
            />
            <div className="flex h-screen flex-col">
                <NavBar />
                <div className="min-h-0 flex-1">
                    <Outlet />
                </div>
            </div>
        </ThemeProvider>
    );
}
