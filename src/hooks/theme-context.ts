import { createContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextProps {
    theme: Theme;
    toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextProps | null>(null);
