# CrossWord — Architectural POV / Concept Notes (draft)

> The information below may contain inaccuracies and shortcomings.
> Treat it as a “living” POV / intent document, not as a strict spec.

## Goal / North Star

The project aims to behave as a **multi-entrypoint content tool** (PWA + Chrome extension + regular web app) where *content arrives from many sources* (share target, launch queue, paste/drop, CRX capture/snip, URL open) and is then:

- normalized into a small set of **content types**
- routed to a **destination view**
- optionally processed by **AI pipelines**
- delivered via a **reliable cross-context messaging layer** (with queuing/deferred delivery)

The core idea is: **inputs are volatile, UI is transient, but the routing/processing pipeline should be stable and resumable**.

## Repository boundaries (important)

This app intentionally separates modules by import safety:

- `/core/` can’t import from `/frontend/`
- `/pwa/` can’t import from `/frontend/`
- `/frontend/` can’t import from `/test/`

See `apps/CrossWord/src/importants.md`.

## The messaging backbone: `fest/uniform` + unified messaging

### Why `fest/uniform`

The preferred pattern is to treat cross-context communication as **module-like method invocation**:

- “call a function on a remote context”
- “await a response”
- “queue calls until the receiver exists”

Example mental model:

```ts
await channelModuleOfSW.capture(rect)
```

This approach is useful across:

- service workers (PWA)
- chrome extension contexts (SW/background, content scripts, popup, offscreen)
- web workers / dedicated workers
- broadcast channels / postMessage bridges

### How it exists in this repo today

- `apps/CrossWord/src/com/core/UniformChannelManager.ts` manages **view-scoped worker channels** (queued/optimized).
- `apps/CrossWord/src/com/core/UnifiedMessaging.ts` consolidates:
  - handler registration
  - immediate delivery vs queueing
  - BroadcastChannel routing
  - worker-channel routing
  - (planned) pipelines
- `apps/CrossWord/src/crx/shared/CrxMessaging.ts` integrates `fest/uniform` with Chrome extension messaging APIs (runtime + broadcast-like).

The intended property of the system is: **if the destination is not available, the message can be queued and delivered later** (or stored in a cache/inbox for manual pickup).

## PWA / Service Worker worldview

### The service worker is not just caching

The intended SW responsibilities expand beyond offline caching:

- **receive inputs** even if UI is not ready (or not open yet)
- **persist inputs** (queue/inbox) for deferred pickup by the UI
- **broadcast notifications** (“something arrived”, “processing finished”)
- **run limited processing** when appropriate, or hand off to `/api/processing`

The PWA runtime uses:

- `BroadcastChannel` (real-time cross-context notifications)
- `Cache Storage` as a “share-target inbox” for real file payloads and metadata
- optional server/session fallbacks when SW is unavailable during share

### `/share-target`

Conceptually: the app has a “share ingestion” entrypoint that normalizes incoming content.

Implementation notes (current):

- `apps/CrossWord/src/frontend/pwa/sw-handling.ts` consumes:
  - cached share payloads
  - sessionStorage fallback (`rs-pending-share`)
  - BroadcastChannel notifications
- It can trigger `processShareTargetData(...)` and/or forward a high-priority message to the WorkCenter destination (`share-target-input`).

### `/launch-queue`

Conceptually: the PWA can be opened with files from the OS-level “Open with…” (Launch Queue API).

Implementation notes (current):

- `setupLaunchQueueConsumer()` converts file handles into `File` objects.
- If the payload is a single markdown file, it can be opened directly by navigating to `/basic` with `markdown-content` parameters.
- Otherwise, it prefers storing the payload into the share-target cache and redirecting to `/share-target` for a unified ingestion flow.

This aligns with the vision: **“make launch-queue behave like share-target, with a stable pipeline and deferred UI pickup.”**

### `/api/processing` — AI processing gateway

Conceptually: “processing” is a stable API endpoint that accepts normalized content and returns results following routing rules.

Implementation notes (current):

- `apps/CrossWord/src/com/core/UnifiedAIConfig.ts` defines “entrypoint rules” such as:
  - share-target
  - launch-queue
  - paste/drop
  - crx-snip
- Each entrypoint can define:
  - `processingUrl` (currently `/api/processing`)
  - `onResult` (e.g., clipboard)
  - `onAccept` (e.g., attach to associated destination)
  - `doProcess` policy (instantly vs manual)
  - `openApp` policy

This is the “associations” layer expressed as data/config.

### `/api/phosphor-icons/*` — icons proxy

Conceptually: provide a stable icon endpoint that works online/offline.

Implementation notes (current):

- `apps/CrossWord/src/pwa/sw.ts` proxies Phosphor icon assets from CDN and caches them for offline use.

## CRX (Chrome Extension) worldview

The extension is conceptually “PWA-like”, but with its own constraints:

- multiple extension contexts
- content scripts have access to the page DOM
- background/service worker is the central orchestrator

### “Share-target-like” behavior in CRX

The CRX runtime can emit a share-target-like message type and broadcast it to clients:

- It stores a small representation in `chrome.storage.local` (for pickup)
- It broadcasts to a channel (e.g. `rs-share-target`) for real-time notification

The intended UX knobs (from your notes) map to this shape:

- **on-result**: to content-script or to clipboard
- **on-accept**: capture tab by snip rect, do processing
- **open-app**: false (process in background unless the user asked otherwise)

This matches the `crx-snip` rule in `UnifiedAIConfig` (openApp=false, force-processing).

## UI entrypoint: boot/init/menu

The root UI can start as:

- a boot-choice screen (Basic vs Faint OS)
- a direct route-based entry (e.g. `/basic`, `/share-target`)

Implementation notes (current):

- `apps/CrossWord/src/frontend/routing/boot-menu.ts` can try to switch to a routed path and dispatch `route-changed`.
- The boot process is a natural place to initialize:
  - PWA service worker registration
  - Broadcast receivers
  - queue draining (“process pending messages”)

## Basic edition views

These are the main “destinations” where content can land:

- `/basic#explorer`
- `/basic#viewer`
- `/basic#workcenter`
- `/basic#settings`

Intended behavior:

- **Viewer**: render/show markdown/text, preview images
- **WorkCenter**: attach file/blob, show processing outputs/results
- **Explorer**: persistence and organization of assets (TODO to flesh out)
- **Settings**: control processing rules and UX defaults (still evolving)

## Content model

### Content “types”

The project tends to normalize inputs into:

- **File** (named, has type, has size)
- **Blob** (may be unnamed, possibly base64 encoded)
- **Raw** (text/inline content; similar to Blob but primarily string-based)

`UnifiedAIConfig.ts` also uses:

- `text`, `markdown`, `image`, `url`, `base64`

### Content “contexts” (where it came from)

Examples:

- `share-target`
- `launch-queue`
- `paste`
- `drag-drop`
- `crx-snip`
- `broadcast`

### Content “actions” (what to do with it)

Examples:

- view / render
- attach (workcenter)
- process (AI)
- copy (clipboard)
- save (explorer)

## Associations / routing POV (draft)

The core routing idea:

- A single input can have a **default destination**
- User actions can override defaults (explicit intent)
- Processing can produce results that should be routable to *another* destination

### Share-target & launch-queue (defaults)

Draft mapping:

- **images** → WorkCenter
  - on-result: copy to clipboard + show in results
  - on-accept: attach in workcenter + do processing
  - processing-url: `/api/processing`
  - do-process: instantly
  - use-processing-settings: true
- **texts/markdown** (except base64 images) → Viewer
  - on-accept: render

### UI events as routing signals

- **drop**: default action of current view/zone
- **paste**: default action of current view or focused zone

### Cross-destination exchange

Destinations should be able to exchange content:

- Explorer ↔ Viewer ↔ WorkCenter
- WorkCenter results can be sent into Viewer (e.g., “render output”)

Example of “viewer → workcenter” exists already:

- `apps/CrossWord/src/frontend/basic/viewer/MarkdownViewer.ts` can send `share-target-input` to WorkCenter as a fallback “attach” action.

## Practical plan / next iterations (draft)

1. Treat **share-target** as the canonical ingestion pipeline; make other entrypoints normalize into it.
2. Ensure **deferred delivery** is consistent:
   - if UI is not ready: cache/inbox + broadcast “notification”
   - when UI loads: drain inbox, then process/route
3. Keep routing rules data-driven (`UnifiedAIConfig`) and avoid hardcoded scattered logic.
4. Keep CRX and PWA as “same story, different transport”:
   - uniform calls where possible
   - broadcast notifications where useful
   - stable local persistence for deferred pickup

## Original scratchpad

```
# General architectural concept of app...

Preferred to use `fest/uniform` for make/use module-like (inline function/classes/methods calls/invoke), which/with support.

For example, capture action in content-script: `await channelModuleOfSW.capture(rect)`.

You can view examples of implementation in `fest/uniform`, [`test/*`, `Worker.ts`, `index.ts`].

In general, that/this library usable for web/service workers, web sockets, broadcast message/channel, etc.

---

## PWA, service worker

In general, service worker &ould have ability to messaging with main/client/content context/page, include...
- Accept/receive (and follow by association rules) awaiting/pending/deferred results (data, inputs, files) by frontend/client/content (components, views) when opening/init/loading/render.
- Service worker can broadcast data/input/results in realtime (to destination, by/to name or generally), if/when acceptor/port is available (also, calls/invocations/dispatch that accumulated/queued [by `fest/uniform`, as example] may/can/able be proceed/sent when became available or appear in availability).
- Service worker can save/place processing results (files, data, inputs) to inbox/pending/queue for deferred accept data, include tip/hint what to prefers/needs to do.

### `/launch-queue`

### `/share-target`

### `/api/processing` - for AI-based processing, recognition, etc. output/results have/has specific associations/rules.

### `/api/phosphor` - for icons

---

## CRX, chrome extension

Most moments, similar alike/with PWA (service worker and background script)

For example, doing snipping and sending rect/fragment, behaves similar with/alike `/share-target`, but with some specifics:

{ on-result: [into-content-script, to-clipboard], on-accept: [capture-tab-by-snip-rect, do-processing], open-app: false }

In general, chrome extension &ould/preferred to emulate `/launch-queue`, `/crx-capture` (early was `/crx-snip`, but it means by/in content scripts)

## Index/main page - boot/init/load menu/module

- &ould also init PWA/messages/queues/deferred/broadcasting handling

---

## Basic Edition App

- `/basic#explorer`
- `/basic#viewer`
- `/basic#workcenter`
- `/basic#settings`

---

## File/data types

- Files (named)
- Blob (incl. base64 encoded, un-named)
- Raw (such as text/inline, also similar behavior of blob, un-named)

---

## Data associations

### `/share-target`, `/launch-queue`

- `images` -> `/basic#workcenter` with { on-result: [to-clipboard, show-in-results], on-accept: [attach-in-workcenter, do-processing], processing-url: `/api/processing`, do-process: instantly, use-processing-settings: true }
- `texts`, `markdown` (except images in base64) -> `/basic#viewer` with { on-accept: render-in-view }

### By UI/UX actions/events

- "drop"  - default action of current view/zone
- "paste" - default action of current view/[hover/focus]-zone

### By views/destinations (defaults)

- `/viewer` - render/show markdown/text, preview images (if did drop/paste, or images destinated to viewer by some reasons)
- `/workcenter` - attach file/blob, for processing results/outputs in preview block/field/box.
- `/explorer` - TODO to describe
- `/settings` - currently, no viable ideas

### Other cases

Explorer, viewer, workcenter can exchange/sending view/used/raw data/content between destinations/ports/endpoints, even results in workcenter can/may/able be sent into viewer.
```
