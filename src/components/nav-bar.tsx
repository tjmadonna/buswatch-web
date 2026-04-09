import { useTheme } from "@/hooks/use-theme";
import { Map, Moon, Star, Sun } from "lucide-react";
import { NavLink } from "react-router";

export default function NavBar() {
    const { theme, toggle } = useTheme();

    return (
        <nav className="bg-card border-border flex h-14 shrink-0 items-center gap-1 border-b px-4">
            <span className="text-foreground mr-4 text-base font-bold tracking-tight">Pittsburgh Bus Watch</span>
            <NavLink
                to="/"
                end
                className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`
                }>
                <Star className="h-4 w-4" />
                Home
            </NavLink>
            <NavLink
                to="/stops"
                end
                className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`
                }>
                <Map className="h-4 w-4" />
                Map
            </NavLink>
            <button
                type="button"
                onClick={toggle}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary ml-auto rounded-md p-2 transition-colors">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
        </nav>
    );
}
