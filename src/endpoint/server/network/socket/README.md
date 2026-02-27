# Socket transport stack

Responsibilities in `network/socket` are split into three explicit layers.

- `websocket.ts` owns WS transport lifecycle (upgrade, connection, basic client registry, reverse channel).
- `socketio-bridge.ts` owns Socket.IO lifecycle and bridge behavior.
- `socketio-security.ts` owns handshake and CORS/allowRequest policy for Socket.IO.
- `routing/*` owns canonical message normalization and routing helpers shared between websocket/socket.io handlers.

The `routing/` module is currently used to normalize incoming frames and apply message hooks, so transport modules focus on transport mechanics and not protocol decoding details.

Legacy modules under `routing/` in endpoint server still exist as compatibility shells and delegate to these canonical socket implementations.

## Passthrough transport on WebSocket

- `network/socket/websocket.ts` supports raw TCP tunneling frames on WS:
  - `tcp.connect` -> open outbound TCP socket and receive `tcp.connected`,
  - `tcp.send` -> send base64 payload to upstream TCP stream,
  - `tcp.data` -> receive base64 chunks from upstream,
  - `tcp.close`/`tcp.closed` -> close/close confirmation.
- Endpoint-level filtering of destinations uses env vars:
  - `WS_TCP_ALLOW_ALL=true` to disable target restrictions,
  - `WS_TCP_ALLOW_HOSTS=host1,host2` for hostname allowlist,
  - `WS_TCP_ALLOWED_HOSTS_WITH_PORT=host:port,...` for explicit host+port overrides.
