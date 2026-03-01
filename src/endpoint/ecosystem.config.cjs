const NODE_BIN = process.execPath;
const fs = require("fs");
const path = require("path");

const resolveValue = (value) => (value && typeof value === "string" ? value.trim() : "");
const isPortableConfigArg = (value) => resolveValue(value).length > 0;

const extractConfigArg = () => {
    const args = Array.isArray(process.argv) ? process.argv : [];
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (arg === "--config") {
            const next = resolveValue(args[index + 1]);
            if (isPortableConfigArg(next)) return next;
            continue;
        }
        if (arg.startsWith("--config=")) {
            const next = resolveValue(arg.slice("--config=".length));
            if (isPortableConfigArg(next)) return next;
        }
    }
    return "";
};

const resolvePortableConfigPath = () => {
    const explicitArg = resolveValue(extractConfigArg());
    const explicitEnv = resolveValue(process.env.CWS_PORTABLE_CONFIG_PATH);
    const fallback = path.resolve(__dirname, "portable.config.json");
    const source = isPortableConfigArg(explicitArg) ? explicitArg : isPortableConfigArg(explicitEnv) ? explicitEnv : fallback;
    if (!isPortableConfigArg(source)) return "";
    return path.isAbsolute(source) ? source : path.resolve(process.cwd(), source);
};

const readLauncherEnv = (portableConfigPath) => {
    if (!isPortableConfigArg(portableConfigPath)) return {};
    try {
        const raw = fs.readFileSync(portableConfigPath, "utf8");
        const parsed = JSON.parse(raw);
        const launcherEnv = parsed && typeof parsed === "object" && parsed.launcherEnv;
        if (!launcherEnv || typeof launcherEnv !== "object") return {};
        return Object.fromEntries(Object.entries(launcherEnv).filter(([, value]) => value !== undefined));
    } catch {
        return {};
    }
};

const portableConfigPath = resolvePortableConfigPath();
const launcherEnv = readLauncherEnv(portableConfigPath);
const envFromFile = Object.assign({}, launcherEnv);
if (portableConfigPath) {
    envFromFile.CWS_PORTABLE_CONFIG_PATH = portableConfigPath;
}

const normalizeEnvValue = (value) => (value === true || value === false || typeof value === "number" ? String(value) : resolveValue(value));
for (const [key, value] of Object.entries(envFromFile)) {
    envFromFile[key] = normalizeEnvValue(value);
}

module.exports = {
    apps: [
        {
            name: "cws",
            cwd: __dirname,
            // Use Node.js absolute binary directly to prevent npm/cmd invocation drift.
            script: NODE_BIN,
            args: ["./node_modules/tsx/dist/cli.mjs", "server/index.ts"],
            interpreter: "none",
            exec_mode: "fork",
            instances: 1,
            windowsHide: true,
            watch: true,
            watch_delay: 2000,
            restart_delay: 2000,
            min_uptime: 5000,
            max_restarts: 20,
            ignore_watch: ["node_modules", ".git", ".cursor", "dist", "portable", ".data", "run.out.log", "run.err.log", "portable-build.json"],
            watch_options: {
                followSymlinks: false
            },
            env: {
                NODE_ENV: "production",
                CWS_PORTABLE_CONFIG_PATH: path.resolve(__dirname, "portable.config.json"),
                CWS_ASSOCIATED_ID: "L-192.168.0.200",
                CWS_ASSOCIATED_TOKEN: "n3v3rm1nd",
                CWS_UPSTREAM_MODE: "active",
                CWS_UPSTREAM_ENDPOINT_URL: "https://45.147.121.152:8443/",
                CWS_UPSTREAM_USER_ID: "L-192.168.0.200",
                CWS_UPSTREAM_USER_KEY: "n3v3rm1nd",
                CWS_UPSTREAM_DEVICE_ID: "L-192.168.0.200",
                CWS_UPSTREAM_NAMESPACE: "default",
                CWS_UPSTREAM_RECONNECT_MS: 1000,
                CWS_AIRPAD_NATIVE_ACTIONS: "true",
                CWS_AIRPAD_ROBOTJS_ENABLED: "true",
                CWS_CLIPBOARD_LOGGING: "false",
                CWS_UPSTREAM_REJECT_UNAUTHORIZED: "false",
                ...envFromFile
            }
        }
    ]
};
