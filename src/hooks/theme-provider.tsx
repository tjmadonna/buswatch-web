import type { ParentProps } from "solid-js";
import { createEffect, createSignal } from "solid-js";

import { type Theme, ThemeContext } from "@/hooks/theme-context";

function getInitialTheme(): Theme {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
        return saved;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider(props: ParentProps) {
    const [theme, setTheme] = createSignal<Theme>(getInitialTheme());

    createEffect(() => {
        applyTheme(theme());
        localStorage.setItem("theme", theme());
    });

    const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    return <ThemeContext.Provider value={{ theme, toggle }}>{props.children}</ThemeContext.Provider>;
}
