import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig, type Plugin } from "vite";
import { brotliCompressSync, constants, gzipSync } from "zlib";

export default defineConfig({
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss(), compressBuildAssets()],
    build: {
        outDir: "asset/assets",
    },
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "src"),
        },
    },
});

function compressBuildAssets(): Plugin {
    const compressibleExtensions = new Set([".css", ".js", ".json", ".html", ".svg", ".txt", ".xml", ".wasm"]);

    return {
        name: "compress-build-assets",
        apply: "build",
        enforce: "post",
        writeBundle(_, bundle) {
            for (const output of Object.values(bundle)) {
                const sourceBuffer =
                    output.type === "chunk"
                        ? Buffer.from(output.code)
                        : typeof output.source === "string"
                          ? Buffer.from(output.source)
                          : Buffer.from(output.source);

                if (output.fileName.endsWith(".gz") || output.fileName.endsWith(".br")) {
                    continue;
                }

                const extensionIndex = output.fileName.lastIndexOf(".");
                if (extensionIndex < 0) {
                    continue;
                }

                const extension = output.fileName.slice(extensionIndex);
                if (!compressibleExtensions.has(extension)) {
                    continue;
                }

                this.emitFile({
                    type: "asset",
                    fileName: `${output.fileName}.gz`,
                    source: gzipSync(sourceBuffer, { level: 9 }),
                });

                this.emitFile({
                    type: "asset",
                    fileName: `${output.fileName}.br`,
                    source: brotliCompressSync(sourceBuffer, {
                        params: {
                            [constants.BROTLI_PARAM_QUALITY]: 11,
                        },
                    }),
                });
            }
        },
    };
}
