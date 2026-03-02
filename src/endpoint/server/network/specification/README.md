# Network Stack Specification

This document describes the practical contract used by CrossWord endpoint networking.

## 0) Inputs and effective configuration

### 0.1 Source layers

- `portable.config.json`
- `portable-core.json`
- `portable-endpoint.json`
- `network.json` (usually referenced from portable endpoint)

### 0.2 Override rules

- config references are resolved through the prefix loader (`fs:`, `inline:`, `env:`, `data:`)
- environment variables with `CWS_*` are preferred
- `AIRPAD_*` support is retained only where a compatibility path is explicitly implemented
- JSON values in active profile can be merged with endpoint runtime values from startup if provided

## 1) Canonical frame model

All messaging uses the shared frame contract from `network/protocol/protocol.ts`.

### required / core fields

- `from` — source identity used for policy context
- `type` / `action` — message action key
- `payload` / `data` / `body` / `message` — normalized into a single payload through `extractPayload()`
- `namespace` / `ns` — optional namespace/channel hint
- `mode` — `blind`, `secure`, or `inspect`
- `broadcast` — explicit broadcast flag
- `targets` — list for explicit multi-target fanout

### routing fields

- `to`, `target`, `targetId`, `deviceId` are normalized into one target value
- `source` or `from` can be provided in request body for policy context

### helpers

- `normalizeFrame()` — canonical target/path extraction
- `isBroadcastFrame()` — broadcast intent detection

## 2) Routing and policy model

### 2.1 Endpoint policy resolution

`endpointIDs` policy maps define:

- `origins` and `tokens`
- `forward`
- `flags`
- `allowedIncoming`, `allowedOutcoming`
- `roles`

Policy fallback behavior:

- `resolveEndpointForwardTarget()` follows `forward` links and defaults to `self`
- unknown source policy can still proceed through wildcard `*` only in non-strict code paths

### 2.2 Identity and aliasing

- direct identity is matched through IDs, tokens, and origin tokens
- aliases are resolved early via `networkAliases` / `networkAliasMap`
- explicit hostname-like targets are treated as upstream candidates by resolver when policy suggests so

### 2.3 Route decision

- route intent is selected through `route` and runtime availability:
  - `local`
  - `upstream`
  - `both`
  - `auto` (or omitted)
- broadcast semantics:
  - `targets` provided => explicit fanout
  - no `targets` + `broadcast=true` => `broadcastTargets` fallback
  - none => compatibility local multicast behavior

## 3) Transport-level contracts

### 3.1 Socket.IO

- handshake validated by `socketio-security.ts`
- origin allowlist is explicit
- private path has token-based relax/deny rules
- signed frame checks are configurable (`CWS_REQUIRE_SIGNED_MESSAGE`)

### 3.2 WebSocket

- path: `/ws`
- query/query params carry handshake and routing hints
- reverse sessions register as `reverse` transport entries
- supports control frames for transport-native TCP passthrough:
  - `tcp.connect`
  - `tcp.send`
  - `tcp.close`
  - resulting replies `tcp.connected`, `tcp.data`, `tcp.closed`, `tcp.error`

### 3.3 HTTP control

- command routes stay on HTTP REST layer
- frame-like inputs are normalized through `normalizeHttpFrame()` style normalization

### 3.4 Tunnel / upstream

- reverse connector side in `network/stack/upstream.ts` handles keep-alive reconnect loops
- origin side is the local hub receiving normalized upstream frames
- connector modes:
  - `active` (default): open outbound reverse sessions
  - `passive`: do not open reverse sessions

## 4) Fetch-over-network contract

`POST /api/network/fetch` (`/api/request/fetch` compatibility) carries:

- request envelope fields (`method`, `url`, `headers`, `body`, `timeoutMs`, `requestId`)
- response behavior:
  - if reverse peer responds with `requestId`, full response is returned synchronously
  - otherwise transport-level ack/fallback is returned on timeout

## 5) Topology contract

`POST /api/network/topology` returns at minimum:

- current endpoint role views (`gateway`, `reverse`, direct peers)
- `link:user->gateway` and `peer` relationships
- optionally merged static overlay from `endpointTopology`

## 6) Compatibility and migration notes

- new logic lives under `network/*`
- `routing/*` modules remain compatibility imports
- legacy naming preserved where needed:
  - `allowedOutcoming` as alias to `allowedOutgoing`
  - old `AIRPAD_*` environment keys where explicitly mapped
- avoid duplicating transport knobs across multiple config files when pointer chains are in place
