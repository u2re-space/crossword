# AGENTS.md

## Cursor Cloud specific instructions

### Overview

CrossWord i1 is an AI-powered markdown/document processing PWA with a Fastify backend. It is a subfolder of a larger monorepo; the `shared/fest/` framework libraries are stubs in this repo (the real implementations live in the parent monorepo at `../../modules/`).

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite dev server (frontend) | `npm run dev` (root) | 443 (HTTPS) | Use `--port 5173` to avoid needing root privileges |
| Fastify endpoint (backend) | `npm run start` (`src/endpoint/`) | 8443 (HTTPS) + 8080 (HTTP) | |

### Key caveats

- **Node.js >= 24 required.** Use `nvm install 24 && nvm alias default 24` if not already set.
- **HTTPS certificates:** Both Vite and the endpoint server require TLS certs. Self-signed certs live in `private/https/` (frontend) and `src/endpoint/https/` (backend). These are gitignored. If missing, generate them:
  ```
  mkdir -p private/https src/endpoint/https
  openssl req -x509 -newkey rsa:2048 -keyout private/https/key.pem -out private/https/cert.pem -days 365 -nodes -subj '/CN=localhost'
  cp private/https/key.pem src/endpoint/https/
  cp private/https/cert.pem src/endpoint/https/
  ```
  Then create `private/https/certificate.mjs` and `src/endpoint/https/certificate.mjs` that export `{ key, cert }`.
- **Port 443** needs `sudo setcap cap_net_bind_service=+ep $(which node)` or use `--port 5173` instead.
- **`cssnano-preset-advanced`** must be installed (not in `package.json` but required by `postcss.config.js`).
- **`shared/fest/`** stubs: The framework stubs allow the dev server to start but do not provide real functionality. UI components will render as empty placeholders.
- **Python tests** (`src/endpoint/tests/`) all depend on `windows-use` (Windows-only). They cannot run on Linux.
- **No ESLint for TS**: The ESLint config only covers JS files. Use `npx prettier --check` for formatting checks.
- **Endpoint `clipboardy`** is listed as optional but imported unconditionally; it must be installed for the backend to start.

### Lint / Test / Build

- **Lint (formatting):** `npx prettier --check "src/**/*.ts"` (root)
- **Build (frontend):** `npm run build` (root)
- **Build (endpoint):** `npm run build` (`src/endpoint/`)
- **Tests (frontend):** `npm run test:test` (root) — currently echoes "No tests configured"
- **Tests (endpoint):** `cd src/endpoint && python3 -m pytest tests/unit/ -v` — requires `windows-use` (Windows-only)
- **Typecheck (endpoint):** `cd src/endpoint && npx tsc -p tsconfig.json --noEmit` — 2 pre-existing errors
