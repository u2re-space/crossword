# Routing compatibility layer

`routing/*` modules now act as compatibility shims after migration to `network/*`.
They keep legacy import paths stable while the canonical implementations live in:

- `network/http/` for server lifecycle
- `network/socket/` for websocket/socket.io transports
- `network/tunnel/` for upstream peer and tunnel helpers

For new socket work:
- prefer `network/socket/routing/*` for message normalization and route-policy helpers
- keep transport modules focused on lifecycle/IO boundaries
