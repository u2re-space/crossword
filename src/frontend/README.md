# CrossWord Frontend Architecture

## Overview

The CrossWord frontend uses a **Shell + View** architecture that separates UI layout (shells) from content components (views). This enables:

- **Flexible layouts**: Users can choose between different UI shells (basic, faint, raw)
- **Reusable views**: Content components work in any shell
- **Clean separation**: Layout concerns are isolated from business logic

## Directory Structure

```
frontend/
├── boot/                    # Application initialization
│   ├── index.ts            # Boot system, shell loading
│   └── routing.ts          # URL routing utilities
├── shells/                  # UI layout shells
│   ├── types.ts            # Shell/View interfaces
│   ├── registry.ts         # Shell/View registries
│   ├── base-shell.ts       # Base shell implementation
│   ├── basic/              # Basic shell (toolbar nav)
│   ├── faint/              # Faint shell (tabbed sidebar)
│   └── raw/                # Raw shell (minimal, no chrome)
├── views/                   # Content components
│   ├── types.ts            # View interfaces
│   ├── viewer/             # Markdown viewer
│   ├── editor/             # Markdown editor
│   ├── workcenter/         # AI work center
│   ├── explorer/           # File explorer
│   ├── settings/           # Settings panel
│   ├── history/            # History viewer
│   ├── airpad/             # Air trackpad
│   └── home/               # Home/dashboard
├── shared/                  # Shared utilities
│   ├── markdown-renderer.ts
│   ├── file-utils.ts
│   └── storage.ts
└── [legacy]                 # Original code (being migrated)
    ├── basic/
    ├── faint/
    ├── airpad/
    └── ...
```

## Shells

Shells are **UI layout systems** that provide:
- Navigation structure (toolbar, sidebar, tabs)
- View container management
- Theme/styling application
- Status messages

### Available Shells

| Shell | Description | Features |
|-------|-------------|----------|
| `basic` | Classic toolbar navigation | Top nav bar, simple layout |
| `faint` | Tabbed sidebar interface | Collapsible sidebar, tab management |
| `raw` | Minimal shell | No chrome, just content |

### Shell Interface

```typescript
interface Shell {
    id: ShellId;
    name: string;
    layout: ShellLayoutConfig;
    
    mount(container: HTMLElement): Promise<void>;
    unmount(): void;
    navigate(viewId: ViewId, params?: Record<string, string>): Promise<void>;
    loadView(viewId: ViewId): Promise<HTMLElement>;
    setTheme(theme: ShellTheme): void;
    getContext(): ShellContext;
}
```

## Views

Views are **content components** that:
- Render their own UI
- Are shell-agnostic
- Can provide an optional toolbar
- Handle their own state

### Available Views

| View | Description | Icon |
|------|-------------|------|
| `viewer` | Markdown viewer | eye |
| `editor` | Markdown editor | pencil |
| `workcenter` | AI processing hub | lightning |
| `explorer` | File browser | folder |
| `settings` | App configuration | gear |
| `history` | Operation history | clock |
| `airpad` | Remote trackpad | hand-pointing |
| `home` | Dashboard | house |

### View Interface

```typescript
interface View {
    id: ViewId;
    name: string;
    icon?: string;
    
    render(options?: ViewOptions): HTMLElement;
    getToolbar?(): HTMLElement | null;
    lifecycle?: ViewLifecycle;
    
    canHandleMessage?(type: string): boolean;
    handleMessage?(message: unknown): Promise<void>;
}
```

## Boot System

The boot system handles:

1. **Registry initialization** - Register all shells and views
2. **Route parsing** - Determine shell/view from URL
3. **Shell selection** - User choice or preference
4. **Shell mounting** - Load and display the shell
5. **Initial navigation** - Load the first view

### Usage

```typescript
import { boot } from "./boot";

// Mount to container
const shell = await boot({
    container: document.getElementById("app")!,
    theme: { id: "auto", name: "Auto", colorScheme: "auto" }
});

// Shell is now mounted and showing initial view
```

### URL Routing

| URL | Shell | View |
|-----|-------|------|
| `/` | default | default |
| `/basic` | basic | default |
| `/faint` | faint | default |
| `/#viewer` | default | viewer |
| `/basic#workcenter` | basic | workcenter |

## Creating a New Shell

1. Create directory: `shells/myshell/`
2. Implement shell class extending `BaseShell`:

```typescript
import { BaseShell } from "../base-shell";

export class MyShell extends BaseShell {
    id = "myshell" as const;
    name = "My Shell";
    
    layout = {
        hasSidebar: false,
        hasToolbar: true,
        hasTabs: false,
        supportsMultiView: false,
        supportsWindowing: false
    };
    
    protected createLayout(): HTMLElement {
        // Return shell DOM structure
    }
    
    protected getStylesheet(): string | null {
        return myStyles;
    }
}

export function createShell(): MyShell {
    return new MyShell();
}

export default createShell;
```

3. Register in `registry.ts`:

```typescript
ShellRegistry.register({
    id: "myshell",
    name: "My Shell",
    loader: () => import("./myshell")
});
```

## Creating a New View

1. Create directory: `views/myview/`
2. Implement view class:

```typescript
import type { View, ViewOptions } from "../../shells/types";

export class MyView implements View {
    id = "myview" as const;
    name = "My View";
    icon = "star";
    
    render(options?: ViewOptions): HTMLElement {
        // Return view DOM
    }
    
    getToolbar(): HTMLElement | null {
        return null; // Optional toolbar
    }
}

export function createView(): MyView {
    return new MyView();
}

export default createView;
```

3. Register in `registry.ts`:

```typescript
ViewRegistry.register({
    id: "myview",
    name: "My View",
    icon: "star",
    loader: () => import("../views/myview")
});
```

## Theme System

Shells support theming via `ShellTheme`:

```typescript
interface ShellTheme {
    id: string;
    name: string;
    colorScheme: "light" | "dark" | "auto";
    cssVariables?: Record<string, string>;
}
```

Themes are applied to the shell root element as:
- `data-theme="light|dark"` attribute
- CSS custom properties from `cssVariables`

## Migration from Legacy

The original `basic/` and `faint/` directories contain the legacy implementations. These are being migrated to the new architecture:

| Legacy | New Location |
|--------|--------------|
| `basic/Main.ts` | `shells/basic/` + `views/*` |
| `basic/viewer/` | `views/viewer/` |
| `basic/workcenter/` | `views/workcenter/` |
| `basic/settings/` | `views/settings/` |
| `faint/layout/` | `shells/faint/` |
| `faint/views/` | `views/*` |
| `airpad/` | `views/airpad/` |

## Shell Context

Views receive a `ShellContext` that provides:

```typescript
interface ShellContext {
    shellId: ShellId;
    navigate(viewId: ViewId, params?: Record<string, string>): void;
    goBack(): void;
    showMessage(message: string, duration?: number): void;
    navigationState: ShellNavigationState;
    theme: ShellTheme;
    layout: ShellLayoutConfig;
    getContentContainer(): HTMLElement;
    setViewToolbar(toolbar: HTMLElement | null): void;
}
```

Views use this context to:
- Navigate to other views
- Show status messages
- Access theme information
- Set their toolbar in the shell
