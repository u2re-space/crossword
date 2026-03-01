# Network Stack

This folder keeps the dedicated network subsystem for the endpoint server.

Config entry-point for this subsystem is the server portable config pipeline (`server/config/config.ts`):

- `portable.config.json` references modular config files through `portableModules`.
- `portable-core.json` usually points identity/network sources:
  - `endpointIDs: fs:./clients.json`
  - `gateways: fs:./gateways.json`
  - `network: fs:./network.json`
- `portable-endpoint.json` usually routes endpoint runtime loading to the same `network.json` file (`"endpoint": "fs:./network.json"`).
- `network.json` provides shared transport defaults and aliases consumed by the networking layer (for example `allowedOrigins`, protocol timeouts, and optional upstream endpoint lists).

The config loader also supports compact value prefixes:

- `fs:<path>` / `file:<path>` — read text from file path (relative to current config directory for portable files, or current process for runtime env values)
- `inline:<value>` — raw inline string
- `inline:'<value>'` or `inline:"<value>"` — inline string with spaces and escaped characters
- `env:<NAME>` — evaluate environment variable at startup
- `data:<...>` — URI-like inline payload (including `;base64,` payloads)
- `http://` / `https://` payloads are passed through as plain strings if provided

`AIRPAD_*` variables are still understood for compatibility where explicit compatibility mapping is used, while `CWS_*` is preferred.

Пример `portable.config.json` / `portable-endpoint.json`:

```json
{
  "core": "fs:./portable-core.json",
  "endpoint": "fs:./portable-endpoint.json",
  "endpointRuntime": {
    "https": {
      "enabled": "env:CWS_HTTPS_ENABLED",
      "key": "fs:${env:CWS_HTTPS_KEY_PATH}",
      "cert": "inline:'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'",
      "ca": "data:text/plain;base64,LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg...",
      "requestClientCerts": "inline:true",
      "allowUntrustedClientCerts": "inline:false"
    }
  }
}
```

Если в `key/cert/ca` отсутствуют PEM-блоки `BEGIN/END`, движок добавляет их автоматически (`PRIVATE KEY` для `key`, `CERTIFICATE` для `cert`/`ca`).

The subsystem reads environment settings through the new `CWS_*` naming.
Legacy `AIRPAD_*` variables are still read for compatibility where explicitly noted.

Goals:

- single protocol vocabulary across all transports (WebSocket, Socket.IO, HTTP control, and tunnel)
- common wrapper layer for transport setup and lifecycle
- shared message frame normalization and security checks
- transport-specific protocol implementations in one place

Current structure:

- `http/` – HTTP entrypoint and TLS helpers
- `socket/` – Socket transport subsystems
  - WebSocket + Socket.IO transport lifecycles
  - Security and handshake policies
  - `socket/routing/*` for protocol-level message normalization and routing hooks
- `tunnel/` – upstream reverse-link bridge client and routing adapters
- `protocol/` – shared frame/message types and normalization helpers
- `specification/` – protocol contract notes and frame contracts
- `topology.ts` – route policy helpers for dispatch/dispatch-like decisions
- `socket/index.ts` and `tunnel/index.ts` – consolidated public exports per transport subsystem
- `utils/` – crypto and message helpers

## Notes

- `routing/*` modules now delegate to this network layer where behavior is implemented.
- Legacy and helper wrappers are preserved at `routing/*` to keep compatibility with older imports.
- Dispatch semantics are unified across transport layers through `network/topology` plans:
  - single destination,
  - explicit multi-destination `targets` fanout,
  - implicit fanout via `broadcastTargets` config fallback.
- Since `portable-endpoint.json` is now commonly a pointer to `network.json`, avoid duplicating endpoint runtime knobs in multiple json files.
- Address aliases are now supported in dispatch/fetch flows through `networkAliases` configuration,
  and can be used by both socket-based and hostname-like targets.

## Upstream terminology (explicit split)

- **Upstream connector (reverse client)**: current endpoint instance that actively opens outbound connection to another node (`mode=reverse`) and can relay commands outward or to peers.
- **Upstream gateway / origin**: remote node that accepts these reverse connections, proxies/reroutes payloads, and coordinates relay pathways.
- **Where to look in runtime**:
  - connector: `network/stack/upstream.ts` (`startUpstreamPeerClient`, reverse client lifecycle, reconnect, send/receive)
  - gateway/origin side: `/ws` entry (`mode=reverse`) and `network/socket/websocket.ts` where reverse clients are registered as `reverse` transport entries.
- **Connector modes**:
- **active (keepalive)**: opens outbound WS session to gateway (`CWS_UPSTREAM_MODE=active` or default), useful behind NAT/DHCP/mobile.
- **passive**: does not open outbound reverse link (`CWS_UPSTREAM_MODE=passive`), endpoint is expected to be reachable directly by local/private route.
- For upstream connector identity, use:
  - `CWS_ASSOCIATED_ID` (also maps to `deviceId` and `clientId`)
  - `CWS_ASSOCIATED_TOKEN` (auth token/key for upstream and policy checks)
- Also accepted for compatibility:
  - `CWS_UPSTREAM_DEVICE_ID`, `CWS_UPSTREAM_CLIENT_ID`, `CWS_UPSTREAM_USER_ID`
  - `CWS_UPSTREAM_USER_KEY` (`AIRPAD_*` aliases remain supported too)
- If both are omitted:
  - `deviceId` is auto-generated.
  - `clientId` falls back to `deviceId` unless explicitly provided.

Operational server-side fetch:

- `/api/network/fetch` (and compatibility alias routes) provides a virtual request envelope
  over connected reverse peers (best effort synchronous response with timeout, otherwise ack/fallback mode).

Topology configuration:
- Base topology view can be preconfigured in endpoint runtime config under `endpointTopology`
  and merged with live nodes/links returned by `/api/network/topology`.

## New routing intents for networking scenarios

Current focus for the next stage:

- resolve node/peer role in local/NAT/external flows,
- unify dispatch decisions between:
  - direct local websocket/socket.io peers,
  - upstream tunnel relays,
  - reverse keepalive peers,
- expose topology hints from `/api/network/topology`.

Operational pass-through:

- `/ws` now also accepts dedicated TCP passthrough frames (`tcp.connect`, `tcp.send`, `tcp.close`) to keep arbitrary TCP streams alive through websocket channel.
- The frames emit `tcp.connected`, `tcp.data`, `tcp.closed`, and `tcp.error` replies.

---
