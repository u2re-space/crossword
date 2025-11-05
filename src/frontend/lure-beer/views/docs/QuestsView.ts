/* Here will be math, coding, etc. questions (and answers by AI) */
/* Used for solving problems and questions by AI */

import { getDirectoryHandle, H, M, remove } from "fest/lure";
import { toastError, toastSuccess, toastWarning } from "@rs-frontend/lure-beer/overlays/Toast";
import { DocWorkspace, createDeleteEntryAction } from "./DocWorkspace";
import { analyzeRecognizeUnified } from "@rs-core/service/AI-ops/RecognizeData";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";
import { openPickerAndWrite, pasteIntoDir } from "@rs-frontend/utils/FileOps";
import { type DocCollection, type DocParser, type DocEntry, type WorkspaceAction, type EntryActionFactory, } from "../../../utils/Types";
import { sanitizeDocSnippet, truncateDocSnippet } from "@rs-frontend/utils/Formatted";

const QUEST_COLLECTIONS: DocCollection[] = [
    { id: "questions", label: "Questions", dir: "/docs/questions/", description: "Open-ended prompts awaiting solutions." },
    { id: "quests", label: "Quests", dir: "/docs/quests/", description: "Active quests across domains." },
    { id: "coding", label: "Coding", dir: "/docs/coding/", description: "Programming problems and drafts." },
    { id: "math", label: "Math", dir: "/docs/math/", description: "Mathematics tasks and proofs." },
    { id: "solutions", label: "Solutions", dir: "/docs/solutions/", description: "Completed answers and walkthroughs." },
    {
        id: "all",
        label: "Archive",
        dirs: [
            "/docs/questions/",
            "/docs/quests/",
            "/docs/coding/",
            "/docs/math/",
            "/docs/solutions/"
        ],
        description: "Everything in one timeline view."
    }
];

const ensureCollections = async () => {
    for (const collection of QUEST_COLLECTIONS) {
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

const parseQuestEntry: DocParser = async ({ collection, file, directory, filePath }) => {
    const text = await file.text();
    let json: any = null;
    let rawContent = text;
    try {
        json = JSON.parse(text);
    } catch {
        json = null;
    }

    const baseTitle = sanitizeDocSnippet(file.name.replace(/\.[^.]+$/, "")) || file.name;
    const titleSource = json?.title ?? json?.question ?? rawContent.split(/\r?\n/)[0] ?? baseTitle;
    const title = sanitizeDocSnippet(titleSource) || baseTitle;
    const summarySource = json?.question ?? rawContent;
    const summary = truncateDocSnippet(sanitizeDocSnippet(summarySource), 220);
    const answerText = json?.aiAnswer ?? json?.answer ?? null;
    const blob = new Blob([json ? JSON.stringify(json, null, 2) : rawContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const $setter = (el) => {
        el?.renderMarkdown?.(json ? JSON.stringify(json, null, 2) : rawContent);
    }

    //
    const $question = (el) => {
        el?.renderMarkdown?.(json?.question ?? rawContent);
    }

    //
    const $answer = (el) => {
        el?.renderMarkdown?.(answerText);
    }

    const entry: DocEntry = {
        id: `${collection.id}:${filePath}`,
        title: title || baseTitle,
        subtitle: json?.kind ? `${json.kind} • ${new Date(file.lastModified).toLocaleString()}` : new Date(file.lastModified).toLocaleString(),
        summary,
        description: json?.kind,
        path: filePath,
        fileName: file.name,
        collectionId: collection.id,
        modifiedAt: file.lastModified,
        wordCount: (summarySource ?? "").split(/\s+/).filter(Boolean).length,
        searchText: [
            title,
            summary,
            sanitizeDocSnippet(rawContent),
            json?.kind,
            (json?.tags ?? []).map((tag: string) => sanitizeDocSnippet(tag)).join(" ")
        ]
            .filter(Boolean)
            .join(" \n")
            .toLowerCase(),
        renderPreview: (container) => {
            container.replaceChildren(
                H`<div class="doc-preview-frame quest-preview">
                    <header class="doc-preview-header">
                        <div>
                            <h2>${title || baseTitle}</h2>
                            <p class="doc-subtitle">${json?.kind ? `${json.kind} • ` : ""}${new Date(file.lastModified).toLocaleString()}</p>
                        </div>
                        <div class="doc-preview-meta">
                            ${json?.tags?.length ? H`<div class="doc-tag-pile">${json.tags.map((tag: string) => H`<span class="doc-meta-tag">${sanitizeDocSnippet(tag)}</span>`)}</div>` : null}
                            <span class="doc-meta-tag">${file.name}</span>
                        </div>
                    </header>
                    <div class="quest-preview-columns">
                        <section>
                            <h3>Problem</h3>
                            <md-view ref=${$question} src=${URL.createObjectURL(new Blob([(json?.question ?? rawContent)], { type: "text/markdown" }))}></md-view>
                        </section>
                        ${answerText ? H`<section>
                            <h3>Answer</h3>
                            <details class="ai-answer" open>
                                <summary><ui-phosphor-icon icon="sparkle"></ui-phosphor-icon><span>AI Solution</span></summary>
                                <md-view ref=${$answer} src=${URL.createObjectURL(new Blob([answerText], { type: "text/markdown" }))}></md-view>
                            </details>
                        </section>` : null}
                    </div>
                </div>`
            );
        },
        //dispose: () => URL.revokeObjectURL(url),
        raw: json ?? rawContent
    };

    return entry;
};

const makePrimaryActions = (ctx: ReturnType<typeof DocWorkspace>["controller"]): WorkspaceAction[] => [
    {
        id: "upload",
        label: "Upload",
        icon: "upload",
        primary: true,
        onClick: async () => {
            const dir = ctx.getCollectionDirs()[0];
            if (!dir) {
                toastError("Select a destination first");
                return;
            }
            try {
                await openPickerAndWrite(dir, "application/json,text/markdown,text/plain,.json,.md", true);
                toastSuccess("Files uploaded");
                await ctx.reloadCurrent();
            } catch (error) {
                console.warn(error);
                toastError("Upload failed");
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

const makeSecondaryActions = (): WorkspaceAction[] => [
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
        id: "download",
        label: "Export",
        icon: "download",
        onClick: async (ctx) => {
            const entry = ctx.getCurrentEntry();
            if (!entry) {
                toastWarning("Open a quest before exporting");
                return;
            }
            try {
                const file = new File([JSON.stringify(entry.raw ?? {}, null, 2)], `${entry.title.replace(/\s+/g, "-") || "quest"}.json`, {
                    type: "application/json"
                });
                await writeFileSmart(null, "/docs/solutions/", file, { ensureJson: true, sanitize: true });
                toastSuccess("Quest exported to solutions");
            } catch (error) {
                console.warn(error);
                toastError("Export failed");
            }
        }
    }
];

const makeEntryActions = (): EntryActionFactory[] => [
    (entry) => {
        const button = H`<button type="button" class="doc-entry-chip" title="Copy ID">
            <ui-phosphor-icon icon="copy"></ui-phosphor-icon>
        </button>` as HTMLButtonElement;
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const id = entry.fileName.replace(/\.[^.]+$/, "");
            navigator.clipboard.writeText(id).then(() => toastSuccess("Quest ID copied"));
        });
        return button;
    },
    createDeleteEntryAction({
        tooltip: "Delete quest",
        className: "is-danger",
        confirmMessage: (entry) => `Delete "${entry.title}"?`
    })
];

export const QuestsView = () => {
    const workspace = DocWorkspace({
        title: "Problem Workspace",
        subtitle: "Collect prompts, annotate solutions, and iterate across domains.",
        collections: QUEST_COLLECTIONS.map((collection) => ({ ...collection, parser: parseQuestEntry })),
        defaultCollectionId: "quests",
        searchPlaceholder: "Search quests or solutions…",
        actions: [],
        secondaryActions: [],
        entryActions: makeEntryActions(),
        enableDrop: true,
        enablePaste: true,
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
        },
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
        }
    });

    const controller = (workspace as any).controller;
    controller.setActions(makePrimaryActions(controller));
    controller.setSecondaryActions(makeSecondaryActions());

    return workspace;
};
