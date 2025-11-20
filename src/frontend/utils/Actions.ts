import type { EntityDescriptor } from "@rs-core/utils/Types";
import { generateNewPlan } from "@rs-core/workers/AskToPlan";
import { triggerDebugTaskGeneration } from "@rs-core/workers/DebugTaskGenerator";
import { makeEntityEdit } from "@rs-frontend/lure-veela/editors/EntityEdit";
import { handleClipboardItems, sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { downloadByPath, openPickerAndAnalyze, openPickerAndWrite } from "./FileOps";
import { toastSuccess, toastError } from "@rs-frontend/lure-veela/items/Toast";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";
import type { EntityInterface } from "@rs-core/template/EntityInterface";
import { currentWebDav, loadSettings, saveSettings } from "@rs-core/config/Settings";
import { getDirectoryHandle, mountAsRoot } from "fest/lure";
import { NAVIGATION_SHORTCUTS, snapshotSpeedDialItem } from "@rs-frontend/utils/StateStorage";



//
export const iconsPerAction = new Map<string, string>([
    ["add", "user-plus"],
    ["upload", "upload"],
    ["generate", "magic-wand"],
    ["debug-gen", "bug"],
    ["paste-and-recognize", "clipboard"],
    ["snip-and-recognize", "crop"],

    ["file-refresh", "arrows-clockwise"],
    ["file-mount", "screwdriver"],
    ["file-download", "download"],
    ["file-upload", "upload"],

    ["apply-settings", "gear-six"],
    ["import-settings", "upload-simple"],
    ["export-settings", "download-simple"],
    ["open-link", "arrow-square-out"],
    ["copy-link", "link"],
    ["copy-state-desc", "file-code"],
    ["open-view", "compass"]
]);



//
export const labelsPerAction = new Map<string, (entityDesc: EntityDescriptor) => string>([
    ["file-upload", (entityDesc: EntityDescriptor) => `Upload file`],
    ["file-download", (entityDesc: EntityDescriptor) => `Download file`],
    ["file-mount", (entityDesc: EntityDescriptor) => `Mount directory`],
    ["file-refresh", (entityDesc: EntityDescriptor) => `Refresh`],
    ["add", (entityDesc: EntityDescriptor) => `Add ${entityDesc.label}`],
    ["upload", (entityDesc: EntityDescriptor) => `Upload and recognize`], //${entityDesc.label}
    ["generate", (entityDesc: EntityDescriptor) => `Generate ${entityDesc.label}`],
    ["debug-gen", (entityDesc: EntityDescriptor) => `Generate debug tasks for ${entityDesc.label}`],
    ["paste-and-recognize", (entityDesc: EntityDescriptor) => "Paste and recognize"],
    ["snip-and-recognize", (entityDesc: EntityDescriptor) => "Snip and recognize"],
    ["apply-settings", (entityDesc: EntityDescriptor)=>"Save settings"],
    ["import-settings", () => "Import settings"],
    ["export-settings", () => "Export settings"],
    ["open-link", (entityDesc: EntityDescriptor | any) => entityDesc?.label ? `Open ${entityDesc.label}` : "Open link"],
    ["copy-link", () => "Copy link"],
    ["copy-state-desc", () => "Copy shortcut JSON"],
    ["open-view", (entityDesc: EntityDescriptor | any) => `Open ${entityDesc?.label || "view"}`]
]);

const copyTextToClipboard = async (text: string) => {
    if (!text?.length) throw new Error("empty");
    if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.inset = "0";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "true");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    textarea.remove();
    if (!success) throw new Error("execCommand failed");
    return true;
};

//
const ensureHashNavigation = (view: string, viewMaker?: any, props?: any) => {
    if (!view || typeof window === "undefined") return;

    //
    viewMaker?.(view, props); const hash = `#${view}`;
    if (window.location.hash === hash) {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else {
        window.location.hash = hash;
    }
};



//
export const intake = (payload) => sendToEntityPipeline(payload, { entityType: "bonus" }).catch(console.warn);
export const actionRegistry = new Map<string, (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => any>([
    ["apply-settings", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any)=>{
        viewPage = await viewPage;
        const forms = viewPage.forms;
        const tabsState = viewPage.tabsState;
        if (forms) {
            const activeForm = forms.get(tabsState.value);
            activeForm?.requestSubmit?.();
        }
    }],

    ["export-settings", async () => {
        try {
            const settings = await loadSettings();
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `crossword-settings-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toastSuccess("Settings exported");
        } catch (e) {
            console.warn(e);
            toastError("Failed to export settings");
        }
    }],

    ["import-settings", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        viewPage = await viewPage;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const json = JSON.parse(text);
                if (typeof json !== 'object') throw new Error("Invalid JSON");
                
                await saveSettings(json);
                if (viewPage && viewPage.reloadSettings) {
                    await viewPage.reloadSettings(json);
                } else {
                    toastSuccess("Settings imported (reload required)");
                }
            } catch (e) {
                console.warn(e);
                toastError("Failed to import settings");
            }
        };
        input.click();
    }],

    ["open-link", async (context: any, entityDesc: EntityDescriptor)=>{
        const meta = context?.meta?.get?.(context?.id) || null;

        //
        const href = meta?.href || context?.shortcut?.href || context?.href;
        if (!href) { toastError("Link is missing"); return; }

        //
        const target = meta?.target || context?.shortcut?.target || context?.target || "_blank";
        try {
            window?.open?.(href, target, "noopener,noreferrer");
        } catch (error) {
            console.warn(error);
            toastError("Unable to open link");
        }
    }],

    ["copy-link", async (context: any, entityDesc: EntityDescriptor)=>{
        const meta = context?.meta?.get?.(context?.id) || null;

        //
        const href = meta?.href || context?.shortcut?.href || context?.href;
        if (!href) { toastError("Nothing to copy"); return; }

        //
        try {
            await copyTextToClipboard(href);
            toastSuccess("Link copied");
        } catch (error) {
            console.warn(error);
            toastError("Failed to copy link");
        }
    }],

    ["copy-state-desc", async (context: any)=>{
        const item = context?.items?.find?.((item) => item?.id === context?.id) || null;
        const snapshot = snapshotSpeedDialItem(item);
        if (!snapshot) {
            toastError("Nothing to copy");
            return;
        }
        if (snapshot.desc && snapshot.desc.meta && snapshot.desc.action && !snapshot.desc.meta.action) {
            snapshot.desc.meta.action = snapshot.desc.action;
        }
        try {
            await copyTextToClipboard(JSON.stringify(snapshot, null, 2));
            toastSuccess("Shortcut saved to clipboard");
        } catch (error) {
            console.warn(error);
            toastError("Failed to copy shortcut");
        }
    }],

    ["open-view", async (context: any, entityDesc: EntityDescriptor)=>{
        const targetView = context?.meta?.view || (entityDesc as any)?.view || entityDesc?.type;
        if (!targetView) {
            toastError("No view target");
            return;
        }
        ensureHashNavigation(targetView, context?.viewMaker, context?.meta);
    }],



    ["file-upload", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any)=>{
        viewPage = await viewPage;
        const viewer = viewPage?.querySelector("ui-file-manager");
        openPickerAndWrite(viewer?.path, 'text/markdown,text/plain,.md', true)?.then?.(() => {
            toastSuccess("Uploaded");
            currentWebDav?.sync?.upload?.();
        }).catch((e) => {
            toastError("Upload failed");
            console.warn(e);
        });
    }],

    ["file-mount", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        viewPage = await viewPage;
        const viewer = viewPage?.querySelector("ui-file-manager");
        getDirectoryHandle(null, viewer?.path, { create: true })?.then?.(async () => {
            await mountAsRoot("user", true)?.catch?.(console.warn.bind(console));
            toastSuccess("Mounted");
        }).catch((e) => {
            toastError("Mount failed");
            console.warn(e);
        });
    }],

    ["file-download", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        viewPage = await viewPage;
        const viewer = viewPage?.querySelector("ui-file-manager");
        downloadByPath(viewer?.path)?.then?.(() => {
            toastSuccess("Downloaded");
        }).catch((e) => {
            toastError("Download failed");
            console.warn(e);
        });
    }],

    ["file-refresh", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        viewPage = await viewPage;
        const viewer = viewPage?.querySelector("ui-file-manager");
        currentWebDav?.sync?.download?.(viewer?.path)?.then?.(() => {
            viewer?.loadPath?.(viewer?.path);
            toastSuccess("Refreshed");
        }).catch((e) => {
            toastError("Refresh failed");
            console.warn(e);
        });
    }],

    ["debug-gen", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        viewPage = await viewPage;
        try {
            // Use debug task generation for immediate testing
            const results = await triggerDebugTaskGeneration(3); // Generate 3 debug tasks
            //viewPage?.$refresh?.();
            if (results && results.length > 0) {
                toastSuccess(`Generated ${results.length} debug tasks for testing`);
            } else {
                toastError(`Failed to generate debug tasks`);
            }
        } catch (error) {
            console.warn("Debug task generation failed:", error);
            toastError(`Failed to generate debug tasks`);
        }
    }],

    //
    ["generate", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        viewPage = await viewPage;
        const response = await generateNewPlan();
        //viewPage?.$refresh?.();
        if (!response) {
            toastError(`Failed to generate ${entityDesc.label}`);
            return;
        };
        toastSuccess(`Plan generated...`);
    }],

    //
    ["add", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        viewPage = await viewPage;
        try {
            const result = await makeEntityEdit(entityItem, entityDesc, {
                allowLinks: true,
                entityType: entityDesc.type,
                description: `Describe the ${entityDesc.label} and link related entities (actions, bonuses, etc.).`
            });
            if (!result) return;

            //
            const fileName = (`${entityDesc.type}-${crypto.randomUUID()}`).replace(/\s+/g, "-").toLowerCase();
            const fname = (fileName || entityDesc.type)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-');
            const path = `${entityDesc.DIR || ""}${fname}.json`;

            //
            (result as any).__path = path;
            const file = new File([JSON.stringify(result, null, 2)], `${fileName}.json`, { type: "application/json" });
            await writeFileSmart(null, entityDesc.DIR || "/", file, { ensureJson: true, sanitize: true });
            toastSuccess(`${entityDesc.label} saved`);
        } catch (e) {
            console.warn(e);
            toastError(`Failed to save ${entityDesc.label}`);
        }
    }],

    //
    ["upload", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        viewPage = await viewPage;
        try {
            await openPickerAndAnalyze(entityDesc.DIR || "/", 'text/markdown,text/plain,.json,image/*', true);
            toastSuccess(`${entityDesc.label} uploaded`);
        } catch (e) {
            console.warn(e);
            toastError(`Failed to upload ${entityDesc.label}`);
        }
    }],

    //
    ["paste-and-recognize", async () => {
        try {
            if (navigator.clipboard && (navigator.clipboard as any).read) {
                const items = await (navigator.clipboard as any).read();
                await handleClipboardItems(items, (payload) => intake(payload));
                return;
            }
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) { await intake({ text }); }
        } catch (e) { console.warn(e); }
    }],

    ["snip-and-recognize", async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = false;
            input.onchange = async () => {
                const file = input.files?.[0];
                if (file) await intake({ file });
            };
            input.click();
        } catch (e) { console.warn(e); }
    }]
]);

const registerNavigationActions = ()=>{
    NAVIGATION_SHORTCUTS.forEach((shortcut)=>{
        const actionId = `open-view-${shortcut.view}`;
        if (!iconsPerAction.has(actionId)) {
            iconsPerAction.set(actionId, shortcut.icon);
        }
        if (!labelsPerAction.has(actionId)) {
            labelsPerAction.set(actionId, ()=>`Open ${shortcut.label}`);
        }
        if (!actionRegistry.has(actionId)) {
            actionRegistry.set(actionId, async (context: any)=>{
                const nextContext = context || {};
                nextContext.meta = { ...(nextContext.meta || {}), view: shortcut.view };
                return actionRegistry.get("open-view")?.(nextContext, {
                    label: shortcut.label,
                    type: shortcut.view,
                    DIR: "/"
                } as any);
            });
        }
    });
};

registerNavigationActions();
