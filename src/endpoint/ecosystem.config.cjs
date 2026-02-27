const NODE_BIN = process.execPath;

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
                AIRPAD_TUNNEL_DEBUG: "true",
                AIRPAD_UPSTREAM_INVALID_CREDENTIALS_RETRY_MS: "30000",
                AIRPAD_UPSTREAM_REJECT_UNAUTHORIZED: "false",
                AIRPAD_UPSTREAM_ENDPOINT_URL: "192.168.0.200:8443",
                AIRPAD_UPSTREAM_ENDPOINTS: "192.168.0.200:8443,45.147.121.152:8443",
                AIRPAD_UPSTREAM_ENABLED: "true",
                SOCKET_IO_ALLOWED_ORIGINS: "all",
                SOCKET_IO_ALLOW_PRIVATE_NETWORK_ORIGINS: "true",
                SOCKET_IO_ALLOW_UNKNOWN_ORIGIN_WITH_AIRPAD_AUTH: "true"
            }
        }
    ]
};

