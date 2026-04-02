import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
    build: {
        outDir: "asset/assets",
    },
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "src"),
        },
    },
});
