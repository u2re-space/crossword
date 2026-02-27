module.exports = {
    apps: [
        {
            name: "crossword-endpoint",
            cwd: __dirname,
            script: "npm",
            args: "run start",
            watch: false,
            env: {
                NODE_ENV: "production",
                AIRPAD_TUNNEL_DEBUG: "true",
                AIRPAD_UPSTREAM_INVALID_CREDENTIALS_RETRY_MS: "30000",
                SOCKET_IO_ALLOWED_ORIGINS: "all",
                SOCKET_IO_ALLOW_PRIVATE_NETWORK_ORIGINS: "true",
                SOCKET_IO_ALLOW_UNKNOWN_ORIGIN_WITH_AIRPAD_AUTH: "true"
            }
        }
    ]
};

