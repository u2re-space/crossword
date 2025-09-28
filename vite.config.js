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

const crxInputs = {
    popup: resolve(__dirname, "./src/crx/popup/index.html"),
    settings: resolve(__dirname, "./src/crx/settings/index.html"),
    content: resolve(__dirname, "./src/crx/content/main.ts"),
    background: resolve(__dirname, "./src/crx/sw.ts")
};

const createCrxConfig = () => {
    const crxPlugin = crx({ manifest, browser: "chrome" });
    const basePlugins = (baseConfig?.plugins || []).filter((plugin) => plugin?.name !== "vite:singlefile");
    const baseRollup = baseConfig?.build?.rollupOptions ?? {};
    const baseOutput = Array.isArray(baseRollup.output) ? baseRollup.output[0] : (baseRollup.output ?? {});
    const crxOutput = objectAssign({}, baseOutput, {
        inlineDynamicImports: false,
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
    });

    return objectAssign({}, baseConfig, {
        plugins: [...basePlugins, crxPlugin],
        build: objectAssign({}, baseConfig?.build, {
            lib: undefined,
            rollupOptions: objectAssign({}, baseRollup, {
                input: crxInputs,
                output: crxOutput
            })
        })
    });
};

export default async ({ mode } = {}) => {
    if (mode === "crx") {
        return createCrxConfig();
    }
    return baseConfig;
};
