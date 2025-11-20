import { resolve } from "node:path";

//
import optimizer from 'vite-plugin-optimizer';
import https from "../private/https/certificate.mjs";
import postcssConfig from "../postcss.config.js";
import jspmPlugin from "vite-plugin-jspm";

//
import { viteSingleFile } from 'vite-plugin-singlefile';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { VitePWA } from 'vite-plugin-pwa'
import { searchForWorkspaceRoot } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

//
function normalizeAliasPattern(pattern) {
    return pattern.replace(/\/\*+$/, '');
}

//
const importFromTSConfig = (tsconfig, __dirname) => {
    const paths = tsconfig?.compilerOptions?.paths || {};
    const alias = [];
    for (const key in paths) {
        const normalizedKey = normalizeAliasPattern(key);
        const target = paths[key][0];
        const normalizedTarget = normalizeAliasPattern(target);
        alias.push({
            find: normalizedKey,
            replacement: resolve(__dirname, normalizedTarget),
        });
    }
    return alias;
};

//
export const initiate = (NAME = "generic", tsconfig = {}, __dirname = resolve("./", import.meta.dirname))=>{
    const $resolve = { alias: importFromTSConfig(tsconfig, __dirname) }
    const projectMap = new Map([
        ["fest/core", "core.ts"],
        ["fest/icon", "icon.ts"],
        ["fest/fl-ui", "fl.ui"],
        ["fest/object", "object.ts"],
        ["fest/uniform", "uniform.ts"],
        ["fest/dom", "dom.ts"],
        ["fest/veela", "veela.css"],
        ["fest/veela-runtime", "veela.css"],
        ["fest/lure", "lur.e"],
    ]);

    const terserOptions = {
        ecma: 2025,
        keep_classnames: false,
        keep_fnames: false,
        module: true,
        toplevel: true,
        mangle: {
            eval: true,
            keep_classnames: false,
            keep_fnames: false,
            module: true,
            toplevel: true,
            properties: {
                builtins: true,
                keep_quoted: "strict",
                undeclared: true,
                only_annotated: true,
                reserved: ["register", "resolve", "reject", "undefined"]
            }
        },
        compress: {
            ecma: 2025,
            keep_classnames: false,
            keep_fnames: false,
            keep_infinity: false,
            reduce_vars: true,
            reduce_funcs: true,
            pure_funcs: [],
            arguments: true,
            expression: true,
            module: true,
            passes: 3,
            side_effects: true,
            pure_getters: true,
            typeofs: true,
            toplevel: true,
            unsafe: true,
            unsafe_Function: true,
            unsafe_comps: true,
            unsafe_arrows: true,
            unsafe_math: true,
            unsafe_symbols: true,
            unsafe_undefined: true,
            unsafe_methods: true,
            unsafe_regexp: true,
            unsafe_proto: true,
            warnings: true,
            unused: true,
            booleans_as_integers: true,
            hoist_funs: true,
            hoist_vars: true,
            properties: true,
            // don't use in debug mode
            //drop_console: true
        },
        format: {
            braces: false,
            comments: false,
            ecma: 2025,
            //indent_level: 0,
            semicolons: true,
            shebang: true,
            quote_style: 0,
            wrap_iife: true,
            ascii_only: true,
        }
    };

    //
    const isBuild = process.env.npm_lifecycle_event === 'build' || process.env.NODE_ENV === 'production';
    const plugins = [
        /*jspmPlugin({
            downloadDeps: true,
            inputMap: true
        }),*/
        ...(isBuild ? [] : [
            viteStaticCopy({
                targets: [
                    { src: resolve(__dirname, 'src/pwa/manifest.json'), dest: resolve(__dirname, './dist/pwa/') },
                    { src: resolve(__dirname, 'src/pwa/icons/icon.svg'), dest: resolve(__dirname, './dist/pwa/icons/') }
                ]
            })
        ]),
        VitePWA({
            srcDir: resolve(__dirname, "./src/pwa/"),
            dstDir: resolve(__dirname, "./dist/"),
            filename: "sw.ts",
            registerType: 'autoUpdate',
            strategies: 'injectManifest',
            injectRegister: 'auto',
            selfDestroying: false,
            mode: 'development',
            workbox: {
                maximumFileSizeToCacheInBytes: 1024 * 1024 * 8,
                globIgnores: ['**/index.html']
            },
            injectManifest: {
                injectionPoint: undefined,
                maximumFileSizeToCacheInBytes: 1024 * 1024 * 16,
            },
            includeAssets: [
                resolve(__dirname, './src/pwa/icons/icon.svg')
            ],
            manifest: false,
            devOptions: {
                type: 'module',
                enabled: true
            }
        })
    ];

    //
    const manualChunks = function(id) {
        if (id.includes('node_modules')) {
            const modules = id.split('node_modules/');
            const pkg = modules[modules.length - 1].split('/');
            const name = pkg[0].startsWith('@') ? pkg[1] : pkg[0];
            return `vendor/${name}`;
        }
        if (id.includes('/modules/projects/')) {
            const match = id.match(/\/modules\/projects\/([^/]+)/);
            if (match && id?.endsWith?.("src/index.ts")) {
                return `${[...projectMap?.entries?.()]?.find?.(([k,v])=>match?.[0]?.includes?.("/" + v))?.[0]/*?.replace?.("fest/", "")*/ || "unk"}`;
            }
        }
    }

    //
    const rollupOptions = {
        shimMissingExports: true,
        treeshake: {
            annotations: false,
            moduleSideEffects: true,
            unknownGlobalSideEffects: true,
            correctVarValueBeforeDeclaration: true,
            propertyReadSideEffects: true
        },
        input: resolve(__dirname, './src/index.ts'),
        output: {
            compact: true,
            globals: {},
            format: 'es',
            name: NAME,
            dir: resolve(__dirname, './dist'),
            exports: "auto",
            minifyInternalExports: true,
            entryFileNames: "[name].js",
            chunkFileNames: "modules/[name].js",
            assetFileNames: "assets/[name][extname]",
            manualChunks,
        }
    };

    //
    const css = {
        postcss: postcssConfig,
    }

    //
    const optimizeDeps = {
        include: [
            resolve(__dirname, './node_modules/**/*.mjs'),
            resolve(__dirname, './node_modules/**/*.js'),
            resolve(__dirname, './node_modules/**/*.ts'),
            resolve(__dirname, './src/**/*.mjs'),
            resolve(__dirname, './src/**/*.js'),
            resolve(__dirname, './src/**/*.ts'),
            resolve(__dirname, './src/*.mjs'),
            resolve(__dirname, './src/*.js'),
            resolve(__dirname, './src/*.ts'),
            resolve(__dirname, './test/*.mjs'),
            resolve(__dirname, './test/*.js'),
            resolve(__dirname, './test/*.ts')
        ],
        entries: [resolve(__dirname, './src/index.ts')],
        force: true
    }

    //
    const server = {
        port: 443,
        open: false,
        host: "0.0.0.0",
        origin: "https://localhost",
        allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '192.168.0.200', '95.188.82.223'],
        appType: 'spa',
        https,
        fs: {
            strict: false,
            allow: [
                searchForWorkspaceRoot(process.cwd()),
                '../**/*', '../*', '..',
                '../assets/**/*', '../assets/*', '../assets',
                '../../assets/**/*', '../../assets/*', '../../assets',
                resolve(__dirname, './**/*'), resolve(__dirname, './*'), __dirname,
                resolve(__dirname, '../../assets/**/*'), resolve(__dirname, '../../assets/*'), resolve(__dirname, '../../assets'),
                resolve(__dirname, '../assets/**/*'), resolve(__dirname, '../assets/*'), resolve(__dirname, '../assets'),
            ]
        },
        cors: {
            allowedHeaders: "*",
            preflightContinue: true,
            credentials: true,
            methods: "PROPFIND,GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
            origin: "*"
        },
        headers: {
            "Depth": "1",
            "Accept-Language": "*",
            "Content-Security-Policy": "upgrade-insecure-requests",
            "Content-Language": "*",
            "Service-Worker-Allowed": "/",
            "Permissions-Policy": "fullscreen=*, window-management=*",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Access-Control-Allow-Methods": "PROPFIND,HEAD,GET,POST,PUT,MOVE,DELETE,PATCH,OPTIONS",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Request-Headers": "*"
        }
    };

    //
    const build = {
        emptyOutDir: false,
        target: 'esnext',
        outDir: resolve(__dirname, './dist'),
        cssCodeSplit: false,
        chunkSizeWarningLimit: 2048,
        assetsInlineLimit: 1024 * 16,
        minify: false, // "terser",
        sourcemap: 'hidden',
        modulePreload: {
            polyfill: true,
            include: [
                "fest/fl-ui",
                "fest/dom",
                "fest/lure",
                "fest/object",
                "fest/uniform",
            ]
        },
        rollupOptions,
        terserOptions,
        name: NAME,
        lib: {
            formats: ["es"],
            entry: resolve(__dirname, './src/index.ts'),
            name: NAME,
            fileName: NAME,
        },
    }

    //
    return {
        "base": "",
        rollupOptions, plugins, resolve: $resolve, build, css, optimizeDeps, server,
        define: { 'process.env': {} }
    };
}

//
export default initiate;
