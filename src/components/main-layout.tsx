import { Outlet } from "react-router";

import NavBar from "@/components/nav-bar";
import { ThemeProvider } from "@/hooks/theme-provider";

export default function MainLayout() {
    return (
        <ThemeProvider>
            <div className="flex h-screen flex-col">
                <NavBar />
                <div className="min-h-0 flex-1">
                    <Outlet />
                </div>
            </div>
        </ThemeProvider>
    );
}
