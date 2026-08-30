import { type Accessor, createContext } from "solid-js";

export type Theme = "light" | "dark";

export interface ThemeContextProps {
    theme: Accessor<Theme>;
    toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>();
