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

- Reverse bridge client (upstream **connector**) in `network/stack/upstream.ts` reconnects across configured endpoints and opens outbound `mode=reverse` sessions.
- The **origin/gateway** side accepts these sessions and forwards normalized upstream frames into local Hub logic.
- Connector modes:
  - `active` (default): active keepalive reverse connector that auto-connects to upstream gateway.
  - `passive`: no auto-start of reverse connector, endpoint is expected to be directly reachable on local/private path.

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
  - `link:user->gateway` and `peer` links for reverse clients (connector-side topology perspective)
  - optional static overlay can be provided in endpoint config `endpointTopology` and merged with runtime links/nodes

### 5) Address aliases and socket-native identifiers

- Routing now supports token alias expansion before route resolution.
- Configure alias map via endpoint config:
  - `networkAliases` (object): `"alias": "target"` pairs.
  - `networkAliasMap` (object alias): legacy alias key compatibility.
- Alias resolution is applied to explicit dispatch/fetch targets and broadcast target normalizers.

### 6) Socket.IO AirPad routing hints for non-peerId clients

- AirPad clients can expose a stable source and optional route target in handshake query:
  - `__airpad_src` or `__airpad_source`: local source identifier (`sourceId`).
  - `__airpad_route`, `__airpad_route_target`, `routeTarget`, `__airpad_peer`, `__airpad_device`, `__airpad_client`: destination hint used when no explicit target is provided in messages.
  - `__airpad_via=tunnel`: indicates a gateway-forwarded path; tunnel routing uses these hints plus host markers (`__airpad_host`/`__airpad_target`).
  - If no route hint is provided, routing falls back to `__airpad_target` (connection URL host), so direct endpoint URL can act as default destination.

### 7) endpointIDs policy config

- This layer defines peer policy and forwarding rules by normalized peer identity.
  - `origins`: peer-associated IPs or host masks.
  - `tokens`: peer-associated tokens that can be used for identity matching.
  - `forward`: default target if a message has no explicit destination (`self` keeps it local).
  - `flags`: role metadata for runtime behavior (`mobile`, `gateway`, `direct`).
  - `allowedIncoming`: inbound policy checks (`*` allow all, `!ID`, `!IP`, `!{ID}` deny regardless of allow entries).
  - `allowedOutcoming`: outbound policy checks with the same syntax.
- Wildcard entry `endpointIDs["*"]` is the fallback guest/default policy.
- Endpoint operations resolve final targets through `forward` first and then apply policy checks (`source -> target`) before WS or upstream fanout in `/api/network/request` and `/api/network/dispatch`.
- If an explicit source hint is provided in request body (`from`/`source`/`sourceId`/`src`) but cannot be matched to any configured `endpointIDs` policy by policy id/origins/tokens, the request is rejected as unknown source (`"source-unknown"`, message: `"Unknown source. I don't know you"`).
- Examples:
  - If `endpointIDs` contains:
    - `L-192.168.0.200` with `origins: ["45.147.121.152","192.168.0.200"]`
  - then target hints `45.147.121.152` and `192.168.0.200` are resolved to `L-192.168.0.200` before forwarding.
  - Further target `L-192.168.0.110` is used explicitly if provided; otherwise the configured `forward` value (or `self`) is applied.
  - If a request body carries `source` / `from` / `sourceId` (or `src`) and it points to another peer (`L-192.168.0.196`), policy evaluation uses that peer as sender, so rules are checked as if the request was sent directly by that peer while still resolving target via the normal target-IP mapping.

---
