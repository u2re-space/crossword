# Svelte + Beer CSS Frontend

**Planning, Scheduling and Organizer Web Application with AI Tools**

This is the alternative frontend implementation using Svelte and BeerCSS library.

## Overview

A comprehensive planning, scheduling, and organizer web application with integrated AI tools for intelligent task management, event planning, and workflow optimization.

## Features

- **Planner Dashboard**: Overview of tasks, events, and statistics
- **Schedule View**: Calendar-based view with task and event management
- **Organizer View**: Filter and organize tasks and events by status, priority, and date
- **AI Tools**: AI-powered planning, scheduling suggestions, and chat assistant
- **Task Management**: Create, edit, and manage tasks with priorities and status
- **Event Management**: Schedule and track events with locations and times
- **Smart Integration**: Reuses existing core services for AI operations and file system

## Used Frameworks and Libraries

- [Svelte](https://svelte.dev/) - Reactive UI framework
- [Beer CSS](https://beer-css.github.io/) - Material Design CSS framework
- [Material Color Utilities](https://github.com/material/material-color-utilities) - Material Design color system
- [Phosphor Icons](https://phosphoricons.com/) - Icon library
- [SortableJS](https://github.com/SortableJS/Sortable) - Drag and drop functionality

## Project Structure

**Relative to `./src/frontend/svelte-beer/` directory.**

```
svelte-beer/
├── README.md              # This file
├── index.ts               # Main entry point
├── App.svelte             # Root Svelte component
├── components/            # Reusable Svelte components
│   ├── Sidebar.svelte
│   ├── TaskCard.svelte
│   ├── EventCard.svelte
│   ├── CalendarView.svelte
│   └── AIAssistant.svelte
├── pages/                 # Page components
│   ├── PlannerDashboard.svelte
│   ├── ScheduleView.svelte
│   ├── OrganizerView.svelte
│   └── AIToolsView.svelte
├── stores/                # Svelte stores for state management
│   ├── index.ts
│   ├── viewStore.ts
│   ├── tasksStore.ts
│   ├── eventsStore.ts
│   └── aiStore.ts
├── utils/                 # Utility functions
│   ├── index.ts
│   ├── aiHelpers.ts
│   └── dataHelpers.ts
└── styles/                # SCSS styles
    └── main.scss
```

## Setup and Installation

### Prerequisites

The following packages need to be added to `package.json`:

```json
{
  "devDependencies": {
    "svelte": "^5.0.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0"
  }
}
```

### Installation

```bash
npm install
```

### Configuration

The frontend needs to be configured in Vite to handle Svelte files. Add the Svelte plugin to your Vite configuration:

```javascript
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  plugins: [
    svelte({
      // Svelte options
    })
  ]
}
```

## Usage

### Using the Frontend

The svelte-beer frontend can be used as an alternative to the default lure-veela frontend:

```typescript
import { svelteBeerFrontend } from './frontend/svelte-beer/index';

// Bootstrap the frontend
await svelteBeerFrontend(mountElement);
```

Or switch the default export in `src/frontend/index.ts`:

```typescript
export default svelteBeerFrontend;
```

### Integration with Core

The frontend integrates with existing core services:

- **AI Operations**: Uses `@rs-core/service/AI-ops/MakeTimeline` and `@rs-core/workers/AskToPlan`
- **File System**: Uses `@rs-core/workers/FileSystem` for reading/writing tasks and events
- **Settings**: Uses `@rs-core/config/Settings` for AI configuration
- **Entity Types**: Compatible with `@rs-core/template/EntityInterface`

## Components

### PlannerDashboard

Main dashboard showing task statistics, recent tasks, and upcoming events.

### ScheduleView

Calendar-based view for visualizing and managing tasks and events by date.

### OrganizerView

Filter and organize tasks and events by status, priority, and other criteria.

### AIToolsView

AI-powered tools including:
- Smart planning generation
- Auto scheduling
- AI chat assistant

## Stores

### tasksStore

Manages task state with operations for:
- Loading tasks from timeline directory
- Adding, updating, and removing tasks
- Filtering by date and status

### eventsStore

Manages event state with similar operations for events.

### aiStore

Manages AI assistant state:
- Message history
- AI configuration
- GPT instance management

### viewStore

Manages current view state (planner, schedule, organizer, ai).

## Styles

Uses Material Design-inspired CSS custom properties with:
- Light and dark theme support
- Responsive design
- Accessible color contrast
- Modern CSS features

## Development

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Compatibility

This frontend is compatible with the existing core architecture:
- Uses the same entity interfaces
- Compatible with existing file system structure
- Integrates with existing AI services
- Follows the same bootstrap pattern

## Notes

- Event design differs from the main lure-veela version but is compatible with core
- Uses Svelte 5 syntax with runes (if available) or Svelte 4 compatible syntax
- BeerCSS initialization happens automatically on mount
- All stores are initialized on app mount

## Future Enhancements

- Task/Event editor modals
- Drag and drop reordering with SortableJS
- Real-time updates from file system
- Advanced filtering and search
- Export/import functionality
- Mobile-optimized views