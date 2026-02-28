# Network Stack Specification

## 1) Frame model

All network payloads use the shared frame contract from `network/protocol/protocol.ts`.

- `from` — logical sender id
- `to` / `target` / `targetId` / `deviceId` — routing hints for receiver selection
- `namespace` / `ns` — broadcast group/channel
- `type` / `action` — semantic action name
- `payload` / `data` / `body` / `message` — message body, normalized to one payload
- `mode` — protocol mode (`blind` / `secure` / `inspect`)
- `broadcast` — explicit broadcast intent
- `targets` — optional multi-destination fanout list for `/api/network/dispatch`

Normalization:

- `normalizeFrame()` maps legacy fields (`target`, `to`, `targetId`, `deviceId`) into one target value
- `extractPayload()` resolves body payload precedence
- `isBroadcastFrame()` detects broadcast targets and explicit broadcast flag

## 2) Transport contracts

### Socket.IO

- Handshake is validated by `socketio-security`.
- Allowed origin policy is explicit, with fallback behavior for private LAN and token-based allow.
- Signed envelopes can be enforced depending on `AIRPAD_REQUIRE_SIGNED_MESSAGE`.

### WebSocket

- WebSocket endpoint is `/ws` over `Fastify` raw upgrade.
- Client verification uses `userId + userKey` from query and user settings.
- Reverse mode (`mode=reverse`) creates device-linked sockets that can be routed by `deviceId`.
- Additional pass-through stream frames are available for raw TCP bridging:
  - `tcp.connect`, `tcp.send`, `tcp.data`, `tcp.close`, `tcp.closed`.
- Control events include `tcp.error` with reason and message fields.

### HTTP

- REST routes remain application route-level.
- HTTP control and helpers can normalize inputs using `normalizeHttpFrame`.

### Tunnel

- Reverse bridge client in `tunnel/upstream-peer-client.ts` reconnects across configured endpoints.
- Upstream frames are normalized before dispatch into local Hub logic.

### Virtual request-response over keep-alive links

- `POST /api/network/fetch` (and compatibility `/api/request/fetch`) enables server-initiated virtual requests to reverse-connected peers.
- Payload uses the same frame semantics as existing dispatch frames but adds request metadata (`method`, `url`, `headers`, `body`, `timeoutMs`) and `requestId`.
- Current implementation is transport-native:
  - local route: server sends `type: network.fetch` to reverse device map (`sendToDevice`);
  - if the reverse client responds with `requestId` in its WS reply, result is returned as a synchronous response;
  - if no response arrives before timeout, the transport returns the transport outcome (ack/targeting metadata).
- Upstream-only route remains fire-and-forget until remote responder support is implemented on that hop.

## 3) Compatibility layer

- `routing/*` re-exports are compatibility wrappers.
- New implementation is canonical inside `network/*`, with one frame model and shared helpers.

## 4) Identity and topology

- `NetworkFrame` now carries optional routing metadata:
  - `nodeId`, `peerId`, `gatewayId`, `via`, `surface`, `transport`, `target`, `mode`
- The routing decision is now split into:
  - local delivery (reverse WS/SIO device map)
  - upstream delivery (reverse tunnel)
  - dual delivery (`both`) when explicitly requested
- The endpoint now shares a unified fanout model:
  - explicit `targets` list (array) is treated as broadcast intent
  - absent `targets` + `broadcast=true` uses configured fallback list `broadcastTargets`
  - fully empty set still falls back to local multicast for compatibility
- In `/api/network/dispatch` a route resolver now evaluates:
  - explicit API route (`local` / `upstream` / `both`)
  - auto route when `route: "auto"` is passed (or omitted)
  - local reverse target availability
  - upstream transport availability
  - target token form (host-like targets are treated as upstream candidates)
- `/api/network/topology` reflects gateway roles and peer links:
  - `gateway` node when upstream transport is active/available
  - `link:user->gateway` and `peer` links for reverse clients

### 5) Address aliases and socket-native identifiers

- Routing now supports token alias expansion before route resolution.
- Configure alias map via endpoint config:
  - `networkAliases` (object): `"alias": "target"` pairs.
  - `networkAliasMap` (object alias): legacy alias key compatibility.
- Alias resolution is applied to explicit dispatch/fetch targets and broadcast target normalizers.

---
