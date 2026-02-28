# Bi-directional tunneling/proxy system

- For (self-hosted) NG-roking/tunneling (reverse, gateway, keep-alive, connection).
  - For connection from entry/gate network to mobile/NAT connected nodes/peers.
- Peering system (node, apps, devices)...
- NAT passing to local/private network...
- Center/entry/hub external IP address support (gate).

## Planned network topology model

- `node`:
  - a stable actor in the network (`userId` scope) with one or more runtime peers.
- `peer`:
  - reverse-connected device (`mode=reverse`) representing a NATed/mobile node.
- `gateway`:
  - any node that exposes/consumes upstream tunnel while keeping reverse keep-alive to another node.

Flow examples:

- `client-1-pna directly to client-2-pna`
- `client-2-pna through gateway-1 (external opened) to client-2-pna`
- `client-1-ext to gateway-1` (gateway behaves as `client-3-ext`)
- `gateway-1 to client-1-keepalive` (mobile/NAT keepalive reverse)
- `client-2[-ext] through gateway-1 to client-1-keepalive`

Routing intent is evaluated by:

1. explicit API route (`route` in `/api/network/dispatch`),
2. local reverse registry presence,
3. external target heuristics,
4. upstream availability.
