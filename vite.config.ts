import tailwindcss from "@tailwindcss/vite";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";
import { brotliCompressSync, constants, gzipSync } from "zlib";

const OUT_DIR = "asset/assets";

export default defineConfig({
    plugins: [solid(), tailwindcss(), compressBuildAssets()],
    build: {
        outDir: OUT_DIR,
    },
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "src"),
        },
    },
    optimizeDeps: {
        exclude: ["maplibre-gl"],
    },
});

function compressBuildAssets(): Plugin {
    const compressibleExtensions = new Set([".css", ".js", ".json", ".html", ".svg", ".txt", ".xml", ".wasm"]);

    return {
        name: "compress-build-assets",
        apply: "build",
        enforce: "post",
        writeBundle(options, bundle) {
            const outDir = options.dir ?? OUT_DIR;

            for (const output of Object.values(bundle)) {
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

                const sourceBuffer =
                    output.type === "chunk"
                        ? Buffer.from(output.code)
                        : typeof output.source === "string"
                          ? Buffer.from(output.source)
                          : Buffer.from(output.source);

                const outPath = resolve(outDir, output.fileName);

                writeFileSync(`${outPath}.gz`, gzipSync(sourceBuffer, { level: 9 }));
                writeFileSync(
                    `${outPath}.br`,
                    brotliCompressSync(sourceBuffer, {
                        params: {
                            [constants.BROTLI_PARAM_QUALITY]: 11,
                        },
                    }),
                );
            }
        },
    };
}
