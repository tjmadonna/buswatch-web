import { ThemeContext, type ThemeContextProps } from "@/hooks/theme-context";
import { useContext } from "react";

export function useTheme(): ThemeContextProps {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return ctx;
}
