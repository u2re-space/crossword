import type { EntityDescriptor } from "@rs-core/utils/Types";
import { generateNewPlan } from "@rs-core/workers/AskToPlan";
import { triggerDebugTaskGeneration } from "@rs-core/workers/DebugTaskGenerator";
import { makeEntityEdit } from "@rs-frontend/lure/editors/EntityEdit";
import { handleClipboardItems, sendToEntityPipeline } from "@rs-core/workers/FileSystem";
import { openPickerAndAnalyze } from "./FileOps";
import { toastSuccess, toastError } from "@rs-frontend/lure/overlays/Toast";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";
import type { EntityInterface } from "@rs-core/template/EntityInterface";

//
export const iconsPerAction = new Map<string, string>([
    ["add", "user-plus"],
    ["upload", "upload"],
    ["generate", "magic-wand"],
    ["debug-gen", "bug"],
    ["paste-and-recognize", "clipboard"],
    ["snip-and-recognize", "crop"]
]);

//
export const labelsPerAction = new Map<string, (entityDesc: EntityDescriptor) => string>([
    ["add", (entityDesc: EntityDescriptor) => `Add ${entityDesc.label}`],
    ["upload", (entityDesc: EntityDescriptor) => `Upload and recognize`], //${entityDesc.label}
    ["generate", (entityDesc: EntityDescriptor) => `Generate ${entityDesc.label}`],
    ["debug-gen", (entityDesc: EntityDescriptor) => `Generate debug tasks for ${entityDesc.label}`],
    ["paste-and-recognize", (entityDesc: EntityDescriptor) => "Paste and recognize"],
    ["snip-and-recognize", (entityDesc: EntityDescriptor) => "Snip and recognize"]
]);

//
export const intake = (payload) => sendToEntityPipeline(payload, { entityType: "bonus" }).catch(console.warn);
export const actionRegistry = new Map<string, (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => any>([
    ["debug-gen", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
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
        try {
            const result = await makeEntityEdit(entityItem, entityDesc, {
                allowLinks: true,
                entityType: entityDesc.type,
                description: `Describe the ${entityDesc.label} and link related entities (actions, bonuses, etc.).`
            });
            if (!result) return;

            //
            const fileName = (`${entityDesc.type}-${crypto.randomUUID()}`).replace(/\s+/g, "-").toLowerCase();
            const path = `${entityDesc.DIR}${(fileName || entityDesc.type)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, '-')?.replace?.(/[^a-z0-9_\-+#&]/g, '-')}.json`;
            (result as any).__path = path;
            const file = new File([JSON.stringify(result, null, 2)], `${fileName}.json`, { type: "application/json" });
            await writeFileSmart(null, entityDesc.DIR, file, { ensureJson: true, sanitize: true });
            toastSuccess(`${entityDesc.label} saved`);
        } catch (e) {
            console.warn(e);
            toastError(`Failed to save ${entityDesc.label}`);
        }
    }],

    //
    ["upload", async (entityItem: EntityInterface<any, any>, entityDesc: EntityDescriptor, viewPage?: any) => {
        try {
            await openPickerAndAnalyze(entityDesc.DIR, 'text/markdown,text/plain,.json,image/*', true);
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
