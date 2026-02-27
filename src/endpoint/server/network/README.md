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
