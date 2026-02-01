# CrossWord Shell Architecture

## Overview

The CrossWord application uses a **shell-based architecture** that separates:
- **Style System** (CSS framework) - Veela, Basic, or Raw
- **Shell** (layout/frame) - Faint, Basic, or Raw
- **Views** (content components) - Viewer, WorkCenter, Settings, etc.
- **Channels** (communication) - Service worker and component messaging

## Boot Sequence

```
┌─────────────────────────────────────────────────────────────┐
│                    Boot Sequence                             │
├─────────────────────────────────────────────────────────────┤
│  1. Load Style System (Veela CSS / Basic / Raw)             │
│          ↓                                                   │
│  2. Initialize Shell (frame/layout/environment)              │
│          ↓                                                   │
│  3. Apply Theme (light/dark/auto)                            │
│          ↓                                                   │
│  4. Mount Shell to Container                                 │
│          ↓                                                   │
│  5. Initialize Service Channels                              │
│          ↓                                                   │
│  6. Navigate to Default View                                 │
│          ↓                                                   │
│  7. Ready                                                    │
└─────────────────────────────────────────────────────────────┘
```

## Shell/Style Matrix

| Shells/Styles | Faint | Basic | Raw |
|---------------|-------|-------|-----|
| **Veela**     |  [r]  |  [o]  | [o] |
| **Basic**     |  [o]  |  [r]  | [r] |

- **[r]** - recommended
- **[o]** - optional

## Components

### Style Systems

#### Veela CSS (`fest/veela`)
- Full-featured CSS framework with design tokens
- Recommended for Faint shell
- Includes theme system, typography, colors, components

#### Basic
- Minimal styling for basic functionality
- Recommended for Basic and Raw shells

#### Raw
- No CSS framework, browser defaults only
- For minimal/custom layouts

### Shells

#### Faint Shell
- Tabbed sidebar navigation
- Multi-view support
- Windowing capabilities
- Full Veela styling

#### Basic Shell
- Top navigation toolbar
- Single view at a time
- Status bar
- Simple, clean layout

#### Raw Shell
- Minimal frame
- No navigation UI
- Direct view rendering
- For print/airpad/special views

### Views

Views are shell-agnostic content components:

| View       | Route        | Channel        | Description                    |
|------------|--------------|----------------|--------------------------------|
| viewer     | /viewer      | rs-service-viewer     | Content viewer (markdown/files)|
| workcenter | /workcenter  | rs-service-workcenter | AI processing center           |
| settings   | /settings    | rs-service-settings   | App configuration              |
| explorer   | /explorer    | rs-service-explorer   | File browser                   |
| airpad     | /airpad      | rs-service-airpad     | Touch input pad                |
| print      | /print       | rs-service-print      | Print preview                  |
| history    | /history     | rs-service-history    | Action history                 |
| editor     | /editor      | rs-service-editor     | Content editor                 |
| home       | /home        | rs-service-home       | Home/landing                   |

## Service Channels

### Architecture

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐
│   Service   │────→│   BroadcastChannel  │←────│    View     │
│   Worker    │     │   (per component)   │     │  Component  │
└─────────────┘     └─────────────────────┘     └─────────────┘
       │                      │                        │
       │                      ↓                        │
       │            ┌─────────────────────┐            │
       └───────────→│ ServiceChannelManager │←──────────┘
                    │  (singleton)          │
                    └─────────────────────┘
```

### Channel Message Format

```typescript
interface ChannelMessage<T = unknown> {
    type: string;           // Message type
    source: string;         // Sender context
    target: ServiceChannelId; // Target channel
    data: T;                // Payload
    timestamp: number;      // Message time
    correlationId?: string; // For request/response
}
```

### Using Channels in Views

```typescript
import { withViewChannel } from "@rs-frontend/views/ViewChannelMixin";

// Create a channel-connected view
class MyView implements View { ... }
const ConnectedMyView = withViewChannel(MyView, "workcenter");

// The view now has:
// - connectChannel(): Promise<void>
// - disconnectChannel(): void
// - sendMessage<T>(type, data): Promise<void>
// - onChannelMessage(type, handler): unaffected
```

## API Endpoints

### Processing APIs
- `POST /api/processing` - Unified AI processing
- `POST /api/analyze` - Quick content analysis
- `GET /api/test` - API health check

### Asset Proxies
- `GET /api/phosphor-icons/*` - Phosphor icon CDN proxy
- `GET /api/icon-proxy` - Generic icon proxy (CORS)

### Content APIs
- `POST /share-target` - PWA share target handler
- `GET /launch-queue` - File launch handler
- `GET /sw-content/*` - Cached content retrieval
- `GET /clipboard/pending` - Pending clipboard operations

## Usage

### Quick Boot

```typescript
import { bootBasic, bootFaint, bootRaw } from "@rs-frontend/boot";

// Boot Basic shell
await bootBasic(container, "viewer");

// Boot Faint shell with Veela CSS
await bootFaint(container, "workcenter");

// Boot Raw shell (minimal)
await bootRaw(container, "print");
```

### Custom Boot

```typescript
import { bootLoader, type BootConfig } from "@rs-frontend/boot";

const config: BootConfig = {
    styleSystem: "veela",
    shell: "faint",
    defaultView: "workcenter",
    channels: ["workcenter", "settings"],
    rememberChoice: true
};

const shell = await bootLoader.boot(container, config);
```

### View Registration

```typescript
import { ViewRegistry } from "@rs-frontend/shells/registry";

ViewRegistry.register({
    id: "my-custom-view",
    name: "Custom View",
    icon: "star",
    loader: () => import("./my-view")
});
```

## File Structure

```
apps/CrossWord/src/
├── frontend/
│   ├── boot/
│   │   ├── index.ts          # Boot module exports
│   │   └── BootLoader.ts     # Main boot loader
│   ├── shells/
│   │   ├── index.ts          # Shell exports
│   │   ├── types.ts          # Shell types
│   │   ├── base-shell.ts     # Base shell class
│   │   ├── registry.ts       # Shell/View registry
│   │   ├── basic/            # Basic shell
│   │   ├── faint/            # Faint shell
│   │   └── raw/              # Raw shell
│   ├── views/
│   │   ├── index.ts          # View exports
│   │   ├── types.ts          # View types
│   │   ├── ViewChannelMixin.ts  # Channel mixin
│   │   ├── viewer/           # Viewer view
│   │   ├── workcenter/       # WorkCenter view
│   │   ├── settings/         # Settings view
│   │   └── ...
│   └── routing/
│       ├── routing.ts        # Route handlers
│       └── boot-menu.ts      # Boot menu UI
├── com/
│   ├── core/
│   │   ├── ServiceChannels.ts    # Channel manager
│   │   └── UniformChannelManager.ts
│   └── config/
│       └── Names.ts          # Centralized names
└── pwa/
    └── sw.ts                 # Service worker
```

## Migration Notes

### From Legacy to Shell-Boot

The legacy routing system is still supported for backward compatibility:

```typescript
// Legacy (still works)
import { loadSubApp } from "@rs-frontend/routing/routing";
const loader = await loadSubApp("basic");
await loader.mount(container);

// New shell-based approach
import { loadSubAppWithShell } from "@rs-frontend/routing/routing";
const loader = await loadSubAppWithShell("basic", "viewer");
await loader.mount(container);
```

### Preferences

User preferences are stored in localStorage:
- `rs-boot-style` - Selected style system
- `rs-boot-shell` - Selected shell
- `rs-boot-view` - Default view
- `rs-boot-remember` - Whether to remember choice
