# Network Stack

This folder keeps the dedicated network subsystem for the endpoint server.

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
- Address aliases are now supported in dispatch/fetch flows through `networkAliases` configuration,
  and can be used by both socket-based and hostname-like targets.

## Upstream terminology (explicit split)

- **Upstream connector (reverse client)**: current endpoint instance that actively opens outbound connection to another node (`mode=reverse`) and can relay commands outward or to peers.
- **Upstream gateway / origin**: remote node that accepts these reverse connections, proxies/reroutes payloads and can expose a DMZ/edge role.
- **Where to look in runtime**:
  - connector: `network/stack/upstream.ts` (`startUpstreamPeerClient`, reverse client lifecycle, reconnect, send/receive)
  - gateway/origin side: `/ws` entry (`mode=reverse`) and `network/socket/websocket.ts` where reverse clients are registered as `reverse` transport entries.
- **Connector modes**:
- **active (keepalive)**: opens outbound WS session to gateway (`CWS_UPSTREAM_MODE=active` or default), useful behind NAT/DHCP/mobile.
- **passive**: does not open outbound reverse link (`CWS_UPSTREAM_MODE=passive`), endpoint is expected to be reachable directly by local/private route.
- For upstream connector identity you can now set both identifiers from environment:
  - `CWS_UPSTREAM_DEVICE_ID` (legacy, already supported via AIRPAD_UPSTREAM_DEVICE_ID)
  - `CWS_UPSTREAM_CLIENT_ID` (used as a human-friendly peer label)
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
