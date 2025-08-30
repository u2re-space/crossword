# Stack and conventions
Use: Next.js (App Router) + React + TypeScript (strict), TailwindCSS + shadcn/ui (Radix), Zustand, TanStack Query, Zod, date-fns-tz, Dexie (IndexedDB) + OPFS for blobs, MapLibre GL, Umami analytics.
Do not add other UI libs or state managers.
CSS only via Tailwind + CSS variables (HSL). Keep design tokens in styles/globals.css.

# Architecture
Follow ports/adapters:
- lib/store/entityStore.ts: getById, query, upsert, batch
- lib/timeline/buildTimeline.ts: buildTimeline(entities, opts)
- components/entity/EntityCard.tsx — universal entity card
- components/timeline/TimelineView.tsx — day/week
- app/(routes)/timeline, /search, /tasks, /settings

# Quality gates
- TypeScript strict, no any unless justified with comment.
- Accessibility: focus states, aria labels, keyboard nav.
- Performance: no heavy deps; virtualize long lists.
- Tests minimal: unit (Zod schemas), smoke tests for utils.
- Commits: Conventional Commits.

# UI/UX rules
- One Add flow (Drawer). Universal EntityCard layout.
- 12 components max in MVP. 4 screens: Timeline, Search, Entity, Add.
- States: loading/skeleton, empty, error in each view.
- Animations 100–150ms, reduce-motion respected.

# Data and schemas
- All entities validated by Zod. Time in ISO 8601 with TZ.
- IDs: ULID. LWW conflict resolution.
- Do not couple UI to storage details.

# What to ask user
If requirements unclear: ask for missing props, acceptance criteria, file paths. Never invent APIs.
