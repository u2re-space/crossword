import { H, getDirectoryHandle } from "fest/lure";
import { watchFsDirectory } from "@rs-core/workers/FsWatch";

//
export type DocParserMeta = {
    collection: DocCollection;
    directory: string;
    fileHandle: FileSystemFileHandle;
    file: File;
    filePath: string;
};

export type DocEntry = {
    id: string;
    title: string;
    subtitle?: string;
    summary?: string;
    description?: string;
    path: string;
    fileName: string;
    collectionId: string;
    modifiedAt: number;
    wordCount?: number;
    searchText: string;
    renderPreview: (container: HTMLElement, ctx: DocWorkspaceController) => void | Promise<void>;
    dispose?: () => void;
    raw?: unknown;
};

export type DocParser = (meta: DocParserMeta) => Promise<DocEntry | null>;

export type DocCollection = {
    id: string;
    label: string;
    dir?: string;
    dirs?: string[];
    icon?: string;
    description?: string;
    parser?: DocParser;
    emptyState?: string;
};

export type WorkspaceAction = {
    id: string;
    label: string;
    icon?: string;
    primary?: boolean;
    onClick: (ctx: DocWorkspaceController) => void | Promise<void>;
    disabled?: (ctx: DocWorkspaceController) => boolean;
    tooltip?: string;
};

export type EntryActionFactory = (entry: DocEntry, ctx: DocWorkspaceController) => HTMLElement | null;

export type DocWorkspaceOptions = {
    title?: string;
    subtitle?: string;
    collections: DocCollection[];
    defaultCollectionId?: string;
    actions?: WorkspaceAction[];
    secondaryActions?: WorkspaceAction[];
    entryActions?: EntryActionFactory[];
    searchPlaceholder?: string;
    emptyState?: string;
    enableDrop?: boolean;
    enablePaste?: boolean;
    onDrop?: (event: DragEvent, ctx: DocWorkspaceController) => Promise<void> | void;
    onPaste?: (event: ClipboardEvent, ctx: DocWorkspaceController) => Promise<void> | void;
};

export type DocWorkspaceController = {
    element: HTMLElement;
    options: DocWorkspaceOptions;
    getCollections: () => DocCollection[];
    getCollection: (id?: string) => DocCollection | undefined;
    getCurrentCollection: () => DocCollection | undefined;
    getCollectionDirs: (id?: string) => string[];
    getCurrentEntry: () => DocEntry | null;
    getEntries: (collectionId?: string) => DocEntry[];
    selectCollection: (id: string) => void;
    selectEntry: (entryId: string) => void;
    reload: (collectionId?: string) => Promise<void>;
    reloadCurrent: () => Promise<void>;
    ensureDir: (dir: string) => Promise<FileSystemDirectoryHandle | null>;
    setActions: (actions: WorkspaceAction[]) => void;
    setSecondaryActions: (actions: WorkspaceAction[]) => void;
    setEntryActions: (actions: EntryActionFactory[]) => void;
};

const normalizeCollections = (collections: DocCollection[]): DocCollection[] => {
    return collections.map((collection) => {
        const dirs = collection.dirs?.length
            ? collection.dirs.slice()
            : collection.dir
                ? [collection.dir]
                : [];
        const normalized = { ...collection, dirs };
        if (!normalized.emptyState && collection.description) {
            normalized.emptyState = collection.description;
        }
        return normalized;
    });
};

const DEFAULT_EMPTY_STATE = "No documents yet. Use the toolbar to add one.";

const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const parseMarkdownEntry: DocParser = async ({ collection, file, filePath }) => {
    const text = await file.text();
    const title = text.trim().split(/\r?\n/).find((line) => line.trim().length) || file.name.replace(/\.[^.]+$/, "");
    const summary = text.trim().split(/\r?\n/).slice(0, 6).join(" ").slice(0, 260);
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    const $setter = (el) => {
        el?.renderMarkdown?.(text);
    }

    const entry: DocEntry = {
        id: `${collection.id}:${filePath}`,
        title: title.trim() || file.name,
        subtitle: formatDateTime(file.lastModified),
        summary,
        path: filePath,
        fileName: file.name,
        collectionId: collection.id,
        modifiedAt: file.lastModified,
        wordCount,
        searchText: [title, summary, text].filter(Boolean).join(" \n").toLowerCase(),
        renderPreview: (container) => {
            container.replaceChildren(
                H`<div class="doc-preview-frame">
                    <header class="doc-preview-header">
                        <div>
                            <h2>${title.trim() || file.name}</h2>
                            <p class="doc-subtitle">Updated ${formatDateTime(file.lastModified)}</p>
                        </div>
                        ${wordCount ? H`<span class="doc-meta-tag">${wordCount} words</span>` : null}
                    </header>
                    <md-view ref=${$setter} src=${url}></md-view>
                </div>`
            );
        },
        //dispose: () => URL.revokeObjectURL(url),
        raw: text
    };

    return entry;
};

const unique = <T,>(values: T[]) => Array.from(new Set(values));

export const DocWorkspace = (options: DocWorkspaceOptions): HTMLElement & { controller: DocWorkspaceController } => {
    const collections = normalizeCollections(options.collections ?? []);
    const collectionMap = new Map(collections.map((item) => [item.id, item] as const));
    let currentCollectionId = options.defaultCollectionId && collectionMap.has(options.defaultCollectionId)
        ? options.defaultCollectionId
        : collections[0]?.id;

    const collectionTabs = new Map<string, HTMLButtonElement>();
    const entryButtons = new Map<string, HTMLButtonElement>();
    const watchers = new Map<string, () => void>();
    const entries = new Map<string, DocEntry>();
    let activeEntryId: string | null = null;
    let searchTerm = "";

    let primaryActions = options.actions ? options.actions.slice() : [];
    let secondaryActions = options.secondaryActions ? options.secondaryActions.slice() : [];
    let entryActionFactories = options.entryActions ? options.entryActions.slice() : [];

    const root = H`<section class="doc-workspace" data-drop-enabled=${options.enableDrop ?? false}></section>` as HTMLElement;
    const header = H`<header class="doc-workspace-header">
        <div class="doc-headings">
            ${options.title ? H`<h1>${options.title}</h1>` : null}
            ${options.subtitle ? H`<p>${options.subtitle}</p>` : null}
        </div>
        <div class="doc-header-actions"></div>
    </header>` as HTMLElement;

    const tabsNav = H`<nav class="doc-collections" role="tablist"></nav>` as HTMLElement;
    const searchField = H`<div class="doc-search">
        <ui-icon icon="magnifying-glass"></ui-icon>
        <input type="search" placeholder=${options.searchPlaceholder ?? "Search documents"} />
    </div>` as HTMLElement;

    const listContainer = H`<aside class="doc-listing" aria-label="Documents"></aside>` as HTMLElement;
    const list = H`<ul class="doc-list" role="list"></ul>` as HTMLElement;
    const emptyState = H`<div class="doc-empty-state"></div>` as HTMLElement;

    const preview = H`<section class="doc-preview" aria-live="polite"></section>` as HTMLElement;
    preview.append(H`<div class="doc-preview-placeholder">Select a document to preview it.</div>`);

    const main = H`<div class="doc-body">
        <div class="doc-pane is-sidebar">${[searchField, listContainer]}</div>
        <div class="doc-pane is-preview">${preview}</div>
    </div>` as HTMLElement;

    listContainer.append(list, emptyState);
    root.append(tabsNav, main, header);

    const actionArea = header.querySelector<HTMLElement>(".doc-header-actions")!;
    const primaryBar = H`<div class="doc-actions primary"></div>` as HTMLElement;
    const secondaryBar = H`<div class="doc-actions secondary"></div>` as HTMLElement;
    actionArea.append(primaryBar, secondaryBar);

    const renderPrimaryActions = () => {
        primaryBar.replaceChildren();
        primaryActions.forEach((action, index) => {
            const button = H`<button type="button" class="doc-action ${action.primary ? "is-primary" : ""}">
                ${action.icon ? H`<ui-icon icon=${action.icon}></ui-icon>` : null}
                <span>${action.label}</span>
            </button>` as HTMLButtonElement;
            if (action.tooltip) button.title = action.tooltip;
            button.dataset.actionIndex = String(index);
            button.addEventListener("click", async () => {
                if (action.disabled?.(controller)) return;
                await action.onClick(controller);
            });
            primaryBar.append(button);
        });
    };

    const renderSecondaryActions = () => {
        secondaryBar.replaceChildren();
        secondaryActions.forEach((action, index) => {
            const button = H`<button type="button" class="doc-action">
                ${action.icon ? H`<ui-icon icon=${action.icon}></ui-icon>` : null}
                <span>${action.label}</span>
            </button>` as HTMLButtonElement;
            if (action.tooltip) button.title = action.tooltip;
            button.dataset.actionIndex = String(index);
            button.addEventListener("click", async () => {
                if (action.disabled?.(controller)) return;
                await action.onClick(controller);
            });
            secondaryBar.append(button);
        });
    };

    const controller: DocWorkspaceController = {
        element: root,
        options,
        getCollections: () => collections.slice(),
        getCollection: (id = currentCollectionId || "") => (id ? collectionMap.get(id) : undefined),
        getCurrentCollection: () => (currentCollectionId ? collectionMap.get(currentCollectionId) : undefined),
        getCollectionDirs: (id = currentCollectionId || "") => collectionMap.get(id)?.dirs ?? [],
        getCurrentEntry: () => (activeEntryId ? entries.get(activeEntryId) ?? null : null),
        getEntries: (collectionId = currentCollectionId || "") => Array.from(entries.values()).filter((entry) => entry.collectionId === collectionId),
        selectCollection: (id: string) => {
            if (!collectionMap.has(id) || id === currentCollectionId) return;
            currentCollectionId = id;
            updateTabs();
            void controller.reload(id);
        },
        selectEntry: (entryId: string) => {
            const entry = entries.get(entryId);
            if (!entry) return;
            openEntry(entry);
        },
        reload: async (collectionId = currentCollectionId || "") => {
            if (!collectionMap.has(collectionId)) return;
            await loadCollection(collectionId);
            renderList();
            refreshActionStates();
        },
        reloadCurrent: async () => controller.reload(currentCollectionId || ""),
        ensureDir: async (dir: string) => {
            if (!dir) return null;
            try {
                return await getDirectoryHandle(null, dir, { create: true } as any);
            } catch (error) {
                console.warn(error);
                return null;
            }
        },
        setActions: (actions) => {
            primaryActions = actions ? actions.slice() : [];
            options.actions = primaryActions;
            renderPrimaryActions();
            refreshActionStates();
        },
        setSecondaryActions: (actions) => {
            secondaryActions = actions ? actions.slice() : [];
            options.secondaryActions = secondaryActions;
            renderSecondaryActions();
            refreshActionStates();
        },
        setEntryActions: (actions) => {
            entryActionFactories = actions ? actions.slice() : [];
            options.entryActions = entryActionFactories;
            renderList();
        }
    };

    renderPrimaryActions();
    renderSecondaryActions();

    const refreshActionStates = () => {
        primaryBar.querySelectorAll<HTMLButtonElement>(".doc-action").forEach((button) => {
            const index = Number(button.dataset.actionIndex ?? "-1");
            const action = Number.isFinite(index) ? primaryActions[index] : undefined;
            if (!action) return;
            const disabled = action.disabled?.(controller) ?? false;
            button.toggleAttribute("disabled", disabled);
        });
        secondaryBar.querySelectorAll<HTMLButtonElement>(".doc-action").forEach((button) => {
            const index = Number(button.dataset.actionIndex ?? "-1");
            const action = Number.isFinite(index) ? secondaryActions[index] : undefined;
            if (!action) return;
            const disabled = action.disabled?.(controller) ?? false;
            button.toggleAttribute("disabled", disabled);
        });
    };

    const updateTabs = () => {
        for (const [id, button] of collectionTabs) {
            const selected = id === currentCollectionId;
            button.setAttribute("aria-selected", selected ? "true" : "false");
            button.classList.toggle("is-active", selected);
            button.tabIndex = selected ? 0 : -1;
        }
    };

    const renderCollections = () => {
        tabsNav.replaceChildren();
        for (const collection of collections) {
            const button = H`<button type="button" role="tab" class="doc-collection">
                ${collection.icon ? H`<ui-icon icon=${collection.icon}></ui-icon>` : null}
                <span>${collection.label}</span>
            </button>` as HTMLButtonElement;
            button.addEventListener("click", () => controller.selectCollection(collection.id));
            collectionTabs.set(collection.id, button);
            tabsNav.append(button);
        }
        updateTabs();
    };

    const openEntry = (entry: DocEntry) => {
        if (entry.id === activeEntryId) return;
        const previous = activeEntryId ? entries.get(activeEntryId) : null;
        activeEntryId = entry.id;

        for (const [id, button] of entryButtons) {
            const selected = id === activeEntryId;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-current", selected ? "true" : "false");
        }

        previous?.dispose?.();
        entry.renderPreview(preview, controller);
        refreshActionStates();
    };

    const createEntryButton = (entry: DocEntry) => {
        const button = H`<button type="button" class="doc-entry">
            <div class="doc-entry-text">
                <span class="doc-entry-title">${entry.title}</span>
                ${entry.subtitle ? H`<span class="doc-entry-subtitle">${entry.subtitle}</span>` : null}
                ${entry.summary ? H`<span class="doc-entry-summary">${entry.summary}</span>` : null}
            </div>
            <div class="doc-entry-actions"></div>
        </button>` as HTMLButtonElement;
        button.addEventListener("click", () => openEntry(entry));
        const actionsHost = button.querySelector<HTMLElement>(".doc-entry-actions");
        if (actionsHost && entryActionFactories.length) {
            entryActionFactories.forEach((factory) => {
                const control = factory(entry, controller);
                if (control) actionsHost.append(control);
            });
        }
        entryButtons.set(entry.id, button);
        return button;
    };

    const renderList = () => {
        const currentId = currentCollectionId || "";
        const candidateEntries = Array.from(entries.values()).filter((entry) => entry.collectionId === currentId);
        const filtered = searchTerm
            ? candidateEntries.filter((entry) => entry.searchText.includes(searchTerm))
            : candidateEntries;
        filtered.sort((a, b) => b.modifiedAt - a.modifiedAt);

        list.replaceChildren();
        entryButtons.clear();
        if (!filtered.length) {
            emptyState.textContent = collectionMap.get(currentId)?.emptyState || options.emptyState || DEFAULT_EMPTY_STATE;
            emptyState.hidden = false;
            preview.replaceChildren(H`<div class="doc-preview-placeholder">Use the toolbar to add content for "${collectionMap.get(currentId)?.label ?? ""}".</div>`);
            activeEntryId = null;
            refreshActionStates();
            return;
        }

        emptyState.hidden = true;
        for (const entry of filtered) {
            list.appendChild(createEntryButton(entry));
        }

        if (!activeEntryId || !entries.has(activeEntryId) || entries.get(activeEntryId)?.collectionId !== currentId) {
            const first = filtered[0];
            if (first) openEntry(first);
        } else {
            const entry = entries.get(activeEntryId);
            if (entry) openEntry(entry);
        }
    };

    const parseEntry = async (collection: DocCollection, directory: string, fileHandle: FileSystemFileHandle) => {
        try {
            const file = await fileHandle.getFile();
            const filePath = `${directory}${file.name}`;
            const parser = collection.parser ?? parseMarkdownEntry;
            return await parser({ collection, directory, fileHandle, file, filePath });
        } catch (error) {
            console.warn("Failed to parse", collection.id, error);
            return null;
        }
    };

    const ensureWatcher = (dir: string) => {
        const normalized = dir?.endsWith("/") ? dir : `${dir}/`;
        if (!normalized || watchers.has(normalized)) return;
        try {
            const stop = watchFsDirectory(normalized, () => {
                if (!currentCollectionId) return;
                void controller.reload(currentCollectionId);
            });
            watchers.set(normalized, stop);
        } catch (error) {
            console.warn("Failed to watch", normalized, error);
        }
    };

    const stopAllWatchers = () => {
        for (const stop of watchers.values()) {
            try { stop?.(); } catch { /* ignore */ }
        }
        watchers.clear();
    };

    const loadCollection = async (collectionId: string) => {
        const collection = collectionMap.get(collectionId);
        if (!collection) return;
        const dirs = collection.dirs?.length ? unique(collection.dirs) : [];
        const loadedEntries: DocEntry[] = [];

        for (const dir of dirs) {
            const normalizedDir = dir.endsWith("/") ? dir : `${dir}/`;
            ensureWatcher(normalizedDir);
            const handle = await controller.ensureDir(normalizedDir).catch(() => null);
            if (!handle) continue;
            const dirEntries = await Array.fromAsync(handle.entries?.() ?? []).catch(() => [] as any);
            for (const [name, fileHandle] of dirEntries as [string, FileSystemFileHandle][]) {
                if (!fileHandle || !(fileHandle as any).kind || name.endsWith(".crswap")) continue;
                const entry = await parseEntry(collection, normalizedDir, fileHandle);
                if (entry) {
                    loadedEntries.push(entry);
                }
            }
        }

        // clean up removed entries (dispose object URLs, etc.)
        for (const [key, existing] of entries) {
            if (existing.collectionId === collectionId) {
                existing.dispose?.();
                entries.delete(key);
            }
        }

        for (const entry of loadedEntries) {
            entries.set(entry.id, entry);
        }
    };

    renderCollections();

    const searchInput = searchField.querySelector<HTMLInputElement>("input[type=search]")!;
    searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.trim().toLowerCase();
        renderList();
    });

    if (options.enableDrop || options.onDrop) {
        const handleDrop = async (event: DragEvent) => {
            const current = controller.getCurrentCollection();
            if (!current) return;
            root.removeAttribute("data-drop-hover");
            if (options.onDrop) {
                await options.onDrop(event, controller);
            }
        };

        root.addEventListener("dragover", (event) => {
            if (!controller.getCurrentCollection()) return;
            event.preventDefault();
            root.setAttribute("data-drop-hover", "true");
        });
        root.addEventListener("dragleave", () => root.removeAttribute("data-drop-hover"));
        root.addEventListener("drop", (event) => {
            event.preventDefault();
            void handleDrop(event);
        });
    }

    if (options.enablePaste || options.onPaste) {
        root.addEventListener("paste", (event) => {
            const current = controller.getCurrentCollection();
            if (!current) return;
            if (options.onPaste) {
                event.stopPropagation();
                void Promise.resolve(options.onPaste(event, controller));
            }
        });
    }

    void controller.reload(currentCollectionId || "");

    let fsChangedHandler: ((event: Event) => void) | null = null;
    if (typeof document !== "undefined") {
        fsChangedHandler = () => { void controller.reloadCurrent(); };
        document.addEventListener("rs-fs-changed", fsChangedHandler);
    }

    (root as any).controller = controller;
    (root as any).dispose = () => {
        if (fsChangedHandler) {
            document.removeEventListener("rs-fs-changed", fsChangedHandler);
            fsChangedHandler = null;
        }
        stopAllWatchers();
        entries.forEach((entry) => entry.dispose?.());
        entries.clear();
    };

    return root as HTMLElement & { controller: DocWorkspaceController };
};


