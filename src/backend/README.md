## CrossWord backend

Fastify endpoint that powers both **standalone** (offline) and **endpoint** (shared) modes.

### Features
- Fastify v5 with CORS + compression.
- User bootstrap with `userId` / `userKey`, optional per-user encryption.
- Per-user storage under `.data/users/{userId}/` with list/get/put/delete APIs.
- Per-user settings storage (`/core/user/settings`) merged with app defaults.
- AI gateway placeholders (`/core/ai/recognize`, `/core/ai/analyze`, `/core/ai/timeline`) that accept `userId`/`userKey` and return queue-friendly payloads.
- Health endpoint `/health`.

### Auth model
- `POST /core/auth/register` → issues `userId`, `userKey`, remembers `encrypt` flag.
- `POST /core/auth/rotate` → rotates `userKey`, optionally toggles encryption.
- Every protected route requires `userId` + `userKey`.

### Storage APIs
- `POST /core/storage/list` { userId, userKey, dir? }
- `POST /core/storage/get` { userId, userKey, path, encoding? }
- `POST /core/storage/put` { userId, userKey, path, data, encoding? }
- `POST /core/storage/delete` { userId, userKey, path }
- When encryption is enabled for the user, files are AES-256-GCM-encrypted transparently.

### Settings API
- `GET /core/user/settings?userId=&userKey=`
- `POST /core/user/settings` { userId, userKey, settings }

### AI placeholders
Endpoints return pre-shaped payloads so the PWA can keep queueing data. Replace internals with real AI pipelines as needed:
- `POST /core/ai/recognize`
- `POST /core/ai/analyze`
- `POST /core/ai/timeline`

### Run
```bash
npm install
npm run start -- --port 6065
```

Environment:
- Uses `.data/` next to `src/backend` for persisted users/settings/files.

### Admin UI
- Served at `/admin` (static HTML/JS/CSS).
- Supports health checks, user register/rotate, settings load/save (AI, MCP, storage), and storage listing.
