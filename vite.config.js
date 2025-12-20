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
    offscreen: resolve(crxRoot, "./offscreen/copy.html"),
    content: resolve(crxRoot, "./content/main.ts"),
    background: resolve(crxRoot, "./sw.ts")
};

const createCrxConfig = () => {
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

    //
    const crxOutput = objectAssign({}, baseOutput, {
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
            lib: undefined,
            // Disable modulePreload for CRX - causes broken imports with __vitePreload
            modulePreload: false,
            rollupOptions: {
                ...baseRollup,
                input: crxInputs,
                output: {
                    ...crxOutput,
                    // Don't use manualChunks from base config - let CRX plugin handle chunking
                    manualChunks: undefined,
                }
            }
        }
    };
};

export default async ({ mode } = {}) => {
    if (mode === "crx") {
        return createCrxConfig();
    }
    return baseConfig;
};
