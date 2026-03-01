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
                CWS_ASSOCIATED_ID: "L-192.168.0.200",
                CWS_ASSOCIATED_TOKEN: "n3v3rm1nd"
            }
        }
    ]
};
