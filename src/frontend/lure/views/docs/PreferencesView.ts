import { type DocCollection, type WorkspaceAction, type DocWorkspaceController } from "../../../utils/Types";
import { toastError, toastSuccess } from "@rs-frontend/lure/overlays/Toast";
import { getDirectoryHandle } from "fest/lure";
import { currentWebDav } from "@rs-core/config/Settings";
import { analyzeRecognizeUnified } from "@rs-core/service/AI-ops/RecognizeData";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";
import { openPickerAndRecognize, pasteIntoDir } from "../../../utils/FileOps";
import { createDeleteEntryAction, DocWorkspace } from "./DocWorkspace";

const COLLECTIONS: DocCollection[] = [
    { id: "plans", label: "Plans", dir: "/docs/plans/", description: "Strategic roadmaps and day-to-day plans." },
    { id: "ideas", label: "Ideas", dir: "/docs/ideas/", description: "Inspirations and captured thoughts." },
    { id: "notes", label: "Notes", dir: "/docs/notes/", description: "Scratchpad and quick notes." },
    { id: "preferences", label: "Preferences", dir: "/docs/preferences/", description: "Personal preferences and guardrails." },
    {
        id: "all",
        label: "Archive",
        dirs: [
            "/docs/plans/",
            "/docs/ideas/",
            "/docs/notes/",
            "/docs/preferences/"
        ],
        description: "Combined view across all notebooks."
    }
];

const ensureCollections = async () => {
    for (const collection of COLLECTIONS) {
        const dirs = collection.dirs ?? (collection.dir ? [collection.dir] : []);
        for (const dir of dirs) {
            try {
                await getDirectoryHandle(null, dir, { create: true } as any);
            } catch (error) {
                console.warn("Failed to ensure directory", dir, error);
            }
        }
    }
};

const makePrimaryActions = (ctx: DocWorkspaceController): WorkspaceAction[] => [
    {
        id: "upload",
        label: "Import",
        icon: "upload",
        primary: true,
        onClick: async () => {
            const dir = ctx.getCollectionDirs()[0];
            if (!dir) {
                toastError("Select a destination first");
                return;
            }
            try {
                await openPickerAndRecognize(dir, "text/markdown,text/plain,.md,image/*", true);
                toastSuccess("Files imported");
                await ctx.reloadCurrent();
            } catch (error) {
                console.warn(error);
                toastError("Import failed");
            }
        }
    },
    {
        id: "paste",
        label: "Paste",
        icon: "clipboard",
        onClick: async () => {
            const dir = ctx.getCollectionDirs()[0];
            if (!dir) {
                toastError("Select a collection first");
                return;
            }
            try {
                const ok = await pasteIntoDir(dir);
                if (ok) {
                    toastSuccess("Clipboard saved");
                    await ctx.reloadCurrent();
                } else {
                    toastError("Clipboard empty");
                }
            } catch (error) {
                console.warn(error);
                toastError("Paste failed");
            }
        }
    },
    {
        id: "refresh",
        label: "Refresh",
        icon: "arrows-clockwise",
        onClick: async () => {
            await ctx.reloadCurrent();
            toastSuccess("View refreshed");
        }
    }
];

const makeSecondaryActions = (ctx: DocWorkspaceController): WorkspaceAction[] => [
    {
        id: "mount",
        label: "Mount",
        icon: "screwdriver",
        onClick: async () => {
            try {
                await ensureCollections();
                toastSuccess("Directories ready");
            } catch (error) {
                console.warn(error);
                toastError("Mount failed");
            }
        }
    },
    {
        id: "sync",
        label: "Sync",
        icon: "arrows-in-line-vertical",
        onClick: async () => {
        try {
            await currentWebDav?.sync?.download?.();
            toastSuccess("Sync requested");
        } catch (error) {
            console.warn(error);
            toastError("Sync failed");
        }
        },
        disabled: () => !currentWebDav?.sync
    }
];

//
export const PreferencesView = () => {
    const workspace = DocWorkspace({
        title: "Personal Knowledge",
        subtitle: "Plans, ideas and notes managed as Markdown documents.",
        collections: COLLECTIONS,
        defaultCollectionId: "preferences",
        searchPlaceholder: "Search across notes…",
        actions: [],
        secondaryActions: [],
        enableDrop: true,
        enablePaste: true,
        onPaste: async (_event, ctx) => {
            const dir = ctx.getCollectionDirs()[0];
            if (!dir) return;
            try {
                const ok = await pasteIntoDir(dir);
                if (ok) {
                    toastSuccess("Clipboard saved");
                    await ctx.reloadCurrent();
                }
            } catch (error) {
                console.warn(error);
                toastError("Paste failed");
            }
        },
        onDrop: async (event, ctx) => {
            const dir = ctx.getCollectionDirs()[0];
            if (!dir) return;
            const files = Array.from(event.dataTransfer?.files ?? []);
            if (!files.length) return;
            try {
                await Promise.all(files.map(async (file) => {
                    if (file?.name?.endsWith?.(".md") || file?.type?.includes?.("markdown")) {
                        return writeFileSmart(null, dir, new File([file], `pasted-${Date.now()}.md`, { type: "text/markdown" }));
                    }

                    //
                    const recognized = (await analyzeRecognizeUnified(file)?.catch?.(console.warn.bind(console)))?.data;
                    if (recognized) {
                        return writeFileSmart(null, dir, new File([recognized], file.name, { type: "text/markdown" }));
                    }
                }));
                toastSuccess(`${files.length} file${files.length > 1 ? "s" : ""} added`);
                await ctx.reloadCurrent();
            } catch (error) {
                console.warn(error);
                toastError("Drop failed");
            }
        }
    });

    const controller = (workspace as any).controller as DocWorkspaceController;
    controller.setActions(makePrimaryActions(controller));
    controller.setSecondaryActions(makeSecondaryActions(controller));
    controller.setEntryActions([
        createDeleteEntryAction({
            tooltip: "Delete document",
            className: "is-danger",
            confirmMessage: (entry) => `Delete "${entry.title}" permanently?`
        })
    ]);

    return workspace;
};

