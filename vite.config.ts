import tailwindcss from "@tailwindcss/vite";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, resolve } from "path";
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
    const compressibleExtensions = new Set([".css", ".js", ".json", ".svg", ".txt", ".xml", ".wasm"]);

    function compressFile(filePath: string) {
        const sourceBuffer = readFileSync(filePath);

        writeFileSync(`${filePath}.gz`, gzipSync(sourceBuffer, { level: 9 }));
        writeFileSync(
            `${filePath}.br`,
            brotliCompressSync(sourceBuffer, {
                params: {
                    [constants.BROTLI_PARAM_QUALITY]: 11,
                },
            }),
        );
    }

    function walkAndCompress(dir: string) {
        const minSizeBytes = 1024; // 1 KB minimum

        for (const entry of readdirSync(dir)) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                walkAndCompress(fullPath);
                continue;
            }

            if (entry.endsWith(".gz") || entry.endsWith(".br")) {
                continue;
            }

            const extensionIndex = entry.lastIndexOf(".");
            if (extensionIndex < 0) {
                continue;
            }

            const extension = entry.slice(extensionIndex);
            if (!compressibleExtensions.has(extension)) {
                continue;
            }

            if (stat.size < minSizeBytes) {
                continue;
            }

            compressFile(fullPath);
        }
    }

    return {
        name: "compress-build-assets",
        apply: "build",
        enforce: "post",
        writeBundle(options) {
            const outDir = options.dir ?? resolve(import.meta.dirname, OUT_DIR);
            walkAndCompress(outDir);
        },
    };
}
