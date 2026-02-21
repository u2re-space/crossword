import { resolve } from "node:path";

//
import https from "../private/https/certificate.mjs";
import postcssConfig from "../postcss.config.js";

//
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { VitePWA } from 'vite-plugin-pwa'
import { searchForWorkspaceRoot } from "vite";
import { ViteMcp } from 'vite-plugin-mcp';

/**
 * Plugin to handle SPA fallback routes (share-target, etc.)
 * Rewrites specific routes to index.html so service worker can intercept
 */
const spaFallbackPlugin = () => ({
    name: 'spa-fallback-routes',
    configureServer(server) {
        // Must be added before Vite's default middleware
        server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            const pathname = url.split('?')[0];

            // Handle share-target routes (redirect to index.html for SW to intercept)
            if (pathname === '/share-target' || pathname === '/share_target') {
                console.log(`[SPA Fallback] Rewriting ${pathname} to /index.html`);
                req.url = '/index.html';
            }

            next();
        });
    }
});

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
        module: true,
        toplevel: true,
        compress: {
            passes: 3,
            drop_console: false,
            pure_getters: true,
        },
        mangle: {
            // Preserve class names used by custom elements (e.g. MarkdownView).
            keep_classnames: true,
        },
    };

    //
    const isBuild = process.env.npm_lifecycle_event === 'build' || process.env.NODE_ENV === 'production';
    const plugins = [
        // SPA fallback for PWA routes (share-target, etc.)
        spaFallbackPlugin(),
        /*jspmPlugin({
            downloadDeps: true,
            inputMap: true
        }),*/
        //...(isBuild ? [] :
        ...[
            viteStaticCopy({
                targets: [
                    { src: resolve(__dirname, './src/pwa/manifest.json'), dest: resolve(__dirname, './dist/pwa/') },
                    { src: resolve(__dirname, './src/pwa/icons/icon.svg'), dest: resolve(__dirname, './dist/pwa/icons/') },
                    { src: resolve(__dirname, './src/pwa/icons/icon.png'), dest: resolve(__dirname, './dist/pwa/icons/') },
                    { src: resolve(__dirname, './src/pwa/icons/icon.ico'), dest: resolve(__dirname, './dist/pwa/icons/') }
                ]
            })
        ],
        ViteMcp({
            target: "browser",
            mode: "development",
            port: 443,
            host: "0.0.0.0",
            origin: "https://192.168.0.200",
            allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '192.168.0.200', '95.188.82.223'],
        }),
        VitePWA({
            srcDir: resolve(__dirname, "./src/pwa/"),
            dstDir: resolve(__dirname, "./dist/"),
            filename: "sw.ts",
            registerType: 'autoUpdate',
            strategies: 'injectManifest',
            injectRegister: 'auto',
            selfDestroying: false,
            mode: 'development',
            // workbox options are ignored when using injectManifest
            injectManifest: {
                injectionPoint: "self.__WB_MANIFEST",
                maximumFileSizeToCacheInBytes: 1024 * 1024 * 16,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
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

    // Packages that are often tree-shaken or only used in workers; keep default chunking to avoid empty chunks
    const VENDOR_SKIP_NAMES = new Set(['png', 'jpeg', 'cbor-x', 'docx', 'ico']);
    const manualChunks = function(id) {
        if (id.includes('node_modules')) {
            const modules = id.split('node_modules/');
            const pkg = modules[modules.length - 1].split('/');
            const name = pkg[0].startsWith('@') ? pkg[1] : pkg[0];
            if (VENDOR_SKIP_NAMES.has(name)) return undefined;
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
            // Use library name for main entry, [name] for dynamic imports
            entryFileNames: (chunkInfo) => {
                // Main entry uses library name
                if (chunkInfo.isEntry && chunkInfo.name === 'index') {
                    return `${NAME}.js`;
                }
                return "[name].js";
            },
            chunkFileNames: "modules/[name].js",
            // Use library name for main CSS, original name for other assets
            assetFileNames: (assetInfo) => {
                const ext = assetInfo.name?.split('.').pop() || '';
                // Main CSS bundle should use library name
                if (ext === 'css') {
                    return `assets/${NAME}[extname]`;
                }
                return "assets/[name][extname]";
            },
            manualChunks,
        }
    };

    //
    const css = {
        postcss: postcssConfig,
        preprocessorOptions: {
            scss: {
                api: "modern",
                quietDeps: true,
                charset: false,
                precision: 8,
            }
        }
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
        force: true,
        optimizeDeps: {
            include: ['**/*.scss'], // Include all .scss files
        }
    }

    //
    const server = {
        port: 443,
        open: false,
        host: "0.0.0.0",
        origin: "https://192.168.0.200",
        allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '192.168.0.200', '95.188.82.223'],
        appType: 'spa',
        https,
        proxy: {
            // Proxy Phosphor icons to avoid CORS issues
            '/assets/icons/phosphor': {
                target: 'https://cdn.jsdelivr.net',
                changeOrigin: true,
                rewrite: (path) => {
                    // Extract style from path (e.g., /assets/icons/phosphor/duotone/copy.svg)
                    const pathParts = path.replace(/^\/assets\/icons\/phosphor\//, '').split('/');
                    const style = pathParts[0];
                    const iconName = pathParts[1]?.replace(/\.svg$/, '') || '';

                    // Add style suffix for duotone and other styles
                    let finalIconName = iconName;
                    if (style === 'duotone') {
                        finalIconName = `${iconName}-duotone`;
                    } else if (style !== 'regular') {
                        finalIconName = `${iconName}-${style}`;
                    }

                    const rewrittenPath = `/npm/@phosphor-icons/core@2/assets/${style}/${finalIconName}.svg`;
                    console.log('Proxying Phosphor icon request:', path, '->', rewrittenPath);
                    return rewrittenPath;
                },
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('Phosphor icons proxy error:', err.message);
                    });
                }
            }
        },
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
        // Configure route-specific handling for different app entry points
        middlewareMode: false,
        configureServer(server) {
            // Handle specific routes to serve appropriate HTML files
            server.middlewares.use((req, res, next) => {
                const url = req.url || '';
                const pathname = url.split('?')[0] || '';

                // Never rewrite service worker requests (must be JS, not HTML)
                if (pathname === '/sw.js' || pathname === '/apps/cw/sw.js') {
                    return next();
                }

                // Handle print route - serve print.html
                // CrossWord uses a single HTML entry in dev; route to index.html.
                if (url.startsWith('/print') || url.startsWith('/basic') || url.startsWith('/faint') || url === '/' || url.startsWith('/?')) {
                    req.url = '/index.html';
                }

                next();
            });
        },
        cors: {
            allowedHeaders: "*",
            preflightContinue: true,
            // Don't combine wildcard origin with credentials=true (browsers will reject it).
            // Echo request Origin instead.
            origin: true,
            credentials: true,
            methods: "PROPFIND,GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
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
            "Access-Control-Request-Headers": "*"
        }
    };

    //
    const build = {
        emptyOutDir: false,
        target: 'esnext',
        outDir: resolve(__dirname, './dist'),
        cssCodeSplit: false,
        // Ensure CSS file is named after the library
        cssFileName: `assets/${NAME}`,
        chunkSizeWarningLimit: 2048,
        assetsInlineLimit: 1024 * 16,
        minify: isBuild ? "terser" : false,
        sourcemap: false,
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
            // Explicitly set CSS file name
            cssFileName: NAME,
        },
    }

    //
    return {
        "base": "",
        rollupOptions, plugins, resolve: $resolve, build, css, optimizeDeps, server, worker: {format: 'es'},
        define: { 'process.env': {} }
    };
}

//
export default initiate;
