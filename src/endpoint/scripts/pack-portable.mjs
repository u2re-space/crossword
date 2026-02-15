#!/usr/bin/env node

import { cp, mkdir, rm, writeFile, chmod, stat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PORTABLE_DIR = path.resolve(ROOT_DIR, "portable");
const BUNDLE_DIR = path.resolve(PORTABLE_DIR, "endpoint-portable");

const EXCLUDED_TOP_LEVEL = new Set([
    "node_modules",
    "portable",
    "dist",
    ".git",
    ".cursor",
    "windows_use",
    "tests"
]);

const nodeModulesMode = (process.env.PORTABLE_NODE_MODULES_MODE || "none").toLowerCase();
const includeNodeModules = nodeModulesMode === "copy" || nodeModulesMode === "ci";
const nowStamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const archiveFlavor = includeNodeModules ? `with-node_modules-${nodeModulesMode}` : "slim";
const archiveName = `endpoint-portable-${archiveFlavor}-${nowStamp}.tar.gz`;
const archivePath = path.resolve(PORTABLE_DIR, archiveName);

const runOrThrow = (command, args, cwd) => {
    const result = spawnSync(command, args, {
        cwd,
        stdio: "inherit",
        shell: false
    });
    if (result.status !== 0) {
        throw new Error(`Command failed: ${command} ${args.join(" ")}`);
    }
};

const copyEntry = async (name) => {
    if (EXCLUDED_TOP_LEVEL.has(name)) return;
    const src = path.resolve(ROOT_DIR, name);
    const dst = path.resolve(BUNDLE_DIR, name);
    await cp(src, dst, { recursive: true });
};

const copyEndpointSources = async () => {
    const entries = await readdir(ROOT_DIR);
    for (const name of entries) {
        await copyEntry(name);
    }
};

const materializeComShims = async () => {
    const shimPath = path.resolve(BUNDLE_DIR, "lib/com/config/SettingsTypes.ts");
    try {
        const shimSource = await readFile(shimPath, "utf-8");
        const match = shimSource.match(/export\s+\*\s+from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/com\/(.+?)["'];?/);
        if (!match?.[1]) return;

        const relativeTarget = match[1];
        const sourceFile = path.resolve(ROOT_DIR, "..", "com", relativeTarget);
        const realSource = await readFile(sourceFile, "utf-8");
        await writeFile(shimPath, realSource, "utf-8");
        console.log(`[portable] Materialized shim: lib/com/config/SettingsTypes.ts <- ${sourceFile}`);
    } catch (error) {
        console.warn("[portable] Unable to materialize COM shim:", error);
    }
};

const installNodeModules = async () => {
    if (!includeNodeModules) {
        console.log("[portable] Skipping node_modules (slim bundle).");
        return;
    }

    if (nodeModulesMode === "copy") {
        const srcModules = path.resolve(ROOT_DIR, "node_modules");
        const dstModules = path.resolve(BUNDLE_DIR, "node_modules");
        try {
            const info = await stat(srcModules);
            if (!info.isDirectory()) throw new Error("node_modules is not a directory");
            console.log("[portable] Reusing existing node_modules...");
            await cp(srcModules, dstModules, { recursive: true });
            return;
        } catch {
            console.warn("[portable] Existing node_modules not found. Falling back to npm ci...");
            console.log("[portable] Installing dependencies inside portable bundle...");
            runOrThrow("npm", ["ci", "--include=dev"], BUNDLE_DIR);
            return;
        }
    }

    if (nodeModulesMode === "ci") {
        console.log("[portable] Installing dependencies inside portable bundle...");
        runOrThrow("npm", ["ci", "--include=dev"], BUNDLE_DIR);
        return;
    }

    throw new Error(`Unknown PORTABLE_NODE_MODULES_MODE: ${nodeModulesMode}`);
};

const writeLaunchers = async () => {
    const runSh = `#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm run start
`;

    const runCmd = `@echo off
cd /d "%~dp0"
call npm run start
`;

    const installNote = includeNodeModules
        ? "- This package includes local node_modules for portability."
        : "- This is a slim bundle without node_modules. Run: npm ci --include=dev";

    const readme = `# Endpoint portable bundle

This bundle is generated from apps/CrossWord/src/endpoint.

## Requirements
- Node.js 22+ and npm

## Run
- Linux/macOS: ./run.sh
- Windows: run.cmd

## Notes
- Node modules mode: ${nodeModulesMode}
${installNote}
- If clipboard backend is unavailable on Linux headless environments, endpoint still starts.
`;

    const runShPath = path.resolve(BUNDLE_DIR, "run.sh");
    const runCmdPath = path.resolve(BUNDLE_DIR, "run.cmd");
    const readmePath = path.resolve(BUNDLE_DIR, "README.PORTABLE.md");

    await writeFile(runShPath, runSh, "utf-8");
    await writeFile(runCmdPath, runCmd, "utf-8");
    await writeFile(readmePath, readme, "utf-8");
    await chmod(runShPath, 0o755);
};

const createArchive = () => {
    console.log(`[portable] Creating archive: ${archivePath}`);
    runOrThrow("tar", ["-czf", archivePath, "endpoint-portable"], PORTABLE_DIR);
};

const main = async () => {
    console.log("[portable] Preparing output directory...");
    await mkdir(PORTABLE_DIR, { recursive: true });
    await rm(BUNDLE_DIR, { recursive: true, force: true });

    console.log("[portable] Copying endpoint sources...");
    await copyEndpointSources();
    await materializeComShims();

    await installNodeModules();
    await writeLaunchers();
    createArchive();

    console.log(`[portable] Done: ${BUNDLE_DIR}`);
    console.log(`[portable] Archive: ${archivePath}`);
};

main().catch((error) => {
    console.error("[portable] Failed:", error);
    process.exit(1);
});
