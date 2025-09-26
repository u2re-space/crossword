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
export const NAME = "ras-klad";
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

const crxPlugin = crx({ manifest, browser: "chrome" });

export default objectAssign(baseConfig, {
    plugins: [...(baseConfig?.plugins || []), crxPlugin],
    build: objectAssign({}, baseConfig?.build, {
        rollupOptions: objectAssign({}, baseConfig?.build?.rollupOptions, {
            input: crxInputs
        })
    })
});
