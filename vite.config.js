import { resolve  } from "node:path";
import { readFile } from "node:fs/promises";
import { crx } from "@crxjs/vite-plugin";

//
const importConfig = (url, ...args)=>{ return import(url)?.then?.((m)=>m?.default?.(...args)); }
const objectAssign = (target, ...sources) => {
    if (!sources?.length) return target;
    const source = sources.shift();
    if (source && typeof source === 'object') {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (source[key] && typeof source[key] === 'object') {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = Array.isArray(source[key]) ? [] : {};
                    }
                    objectAssign(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }
    return objectAssign(target, ...sources);
}

//
export const NAME = "crossword";
export const __dirname = resolve(import.meta.dirname, "./");
    const baseConfig = await importConfig(
        resolve(__dirname, "./shared/vite.config.js"),
        NAME,
        JSON.parse(await readFile(resolve(__dirname, "./tsconfig.json"), { encoding: "utf8" })),
        __dirname
    );

const manifest = await readFile(resolve(__dirname, "./src/crx/manifest.json"), { encoding: "utf8" }).then(JSON.parse);

const crxRoot = resolve(__dirname, "./src/crx");

const crxInputs = {
    popup: resolve(crxRoot, "./popup/index.html"),
    newtab: resolve(crxRoot, "./newtab/index.html"),
    settings: resolve(crxRoot, "./settings/index.html"),
    "markdown-viewer": resolve(crxRoot, "./markdown/viewer.html"),
    "offscreen-copy": resolve(crxRoot, "./offscreen/copy.html"),
    "offscreen-capture": resolve(crxRoot, "./offscreen/capture.html"),
    content: resolve(crxRoot, "./content/main.ts"),
    background: resolve(crxRoot, "./sw.ts")
};

const createCrxConfig = () => {
    // Diagnostic-first CRX build:
    // keep symbol names and disable aggressive optimizations to make
    // runtime errors (ReferenceError/undefined) traceable in the extension.
    const debugCrxBundle = true;

    const crxPlugin = crx({
        manifest,
        browser: "chrome",
        contentScripts: { injectCss: true },
    });
    // CRX build is not a PWA build. Disable PWA-related plugins (PWA + static-copy).
    const isPwaPlugin = (plugin) => {
        const name = plugin?.name;
        return typeof name === "string" && (name === "vite-plugin-pwa" || name.startsWith("vite-plugin-pwa:"));
    };
    const isStaticCopyPlugin = (plugin) => {
        const name = plugin?.name;
        return typeof name === "string" && name.startsWith("vite-plugin-static-copy:");
    };
    const basePlugins = (baseConfig?.plugins || [])
        .flat?.(Infinity)
        ?.filter?.((plugin) => plugin?.name !== "vite:singlefile" && !isPwaPlugin(plugin) && !isStaticCopyPlugin(plugin))
        ?? [];
    const baseRollup = baseConfig?.build?.rollupOptions ?? {};
    const baseOutput = Array.isArray(baseRollup.output) ? baseRollup.output[0] : (baseRollup.output ?? {});

    // Single entry point - client handles all routing
    const entryPoints = {
        choice: resolve(__dirname, './src/choice.ts')
    };

    //
    const crxOutput = objectAssign({}, baseOutput, {
        dir: resolve(__dirname, "./dist-crx"),
        entryFileNames: "app/[name].js",
        chunkFileNames: "modules/[name].js",
        assetFileNames: "assets/[name][extname]",
        inlineDynamicImports: false,
    });

    // CRX build configuration - avoid conflicts with base config
    return {
        ...baseConfig,
        root: crxRoot,
        base: "./",
        plugins: [...basePlugins, crxPlugin],
        build: {
            ...(baseConfig?.build ?? {}),
            outDir: resolve(__dirname, "./dist-crx"),
            lib: undefined,
            // Disable modulePreload for CRX - causes broken imports with __vitePreload
            modulePreload: false,
            // DEBUG: disable minification and keep source maps
            minify: false,
            sourcemap: true,
            terserOptions: undefined,
            // Also disable esbuild-level identifier mangling for diagnostics.
            ...(debugCrxBundle ? {
                reportCompressedSize: false,
                cssMinify: false,
            } : {}),
            rollupOptions: {
                ...baseRollup,
                ...(debugCrxBundle ? {
                    treeshake: false,
                } : {}),
                input: crxInputs,
                output: {
                    ...crxOutput,
                    // Don't use manualChunks from base config - let CRX plugin handle chunking
                    manualChunks: undefined,
                    // Keep readable names
                    compact: false,
                    minifyInternalExports: false,
                }
            }
        },
        esbuild: debugCrxBundle ? {
            keepNames: true,
            minifyIdentifiers: false,
            minifySyntax: false,
            minifyWhitespace: false,
        } : undefined,
    };
};

export default async ({ mode } = {}) => {
    if (mode === "crx") {
        return createCrxConfig();
    }

    // For regular build, modify base config to use multiple entry points
    const config = {
        ...baseConfig,
        build: {
            ...baseConfig.build,
            rollupOptions: {
                ...baseConfig.build?.rollupOptions,
                input: {
                    index: resolve(__dirname, './src/index.ts')
                },
                output: {
                    ...baseConfig.build?.rollupOptions?.output,
                    entryFileNames: 'index.js',
                    chunkFileNames: "modules/[name].js",
                    assetFileNames: (assetInfo) => {
                        const ext = assetInfo.name?.split('.').pop() || '';
                        if (ext === 'css') return `assets/[name][extname]`;
                        return "assets/[name][extname]";
                    },
                }
            }
        }
    };

    return config;
};
