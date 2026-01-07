// Configure marked with KaTeX extension for HTML output with proper delimiters
import { marked, type MarkedExtension } from "marked";
import markedKatex from "marked-katex-extension";
import renderMathInElement from "katex/dist/contrib/auto-render.mjs";

marked?.use?.(markedKatex({
    throwOnError: false,
    nonStandard: true,
    output: "mathml",
    strict: false,
}) as unknown as MarkedExtension,
{
    hooks: {
        preprocess: (markdown: string): string => {
            if (/\\(.*\\)|\\[.*\\]/.test(markdown)) {
                const katexNode = document.createElement('div')
                katexNode.innerHTML = markdown
                renderMathInElement(katexNode, {
                    throwOnError: false,
                    nonStandard: true,
                    output: "mathml",
                    strict: false,
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "\\[", right: "\\]", display: true },
                        { left: "$", right: "$", display: false },
                        { left: "\\(", right: "\\)", display: false }
                    ]
                })

                return katexNode.innerHTML
            }
            return markdown
        },
    },
});

// Re-export state and dependencies interfaces for backward compatibility
export type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";

import type { WorkCenterState, WorkCenterDependencies } from "./WorkCenterState";
import { WorkCenterStateManager } from "./WorkCenterState";
import { WorkCenterUI } from "./WorkCenterUI";
import { WorkCenterFileOps } from "./WorkCenterFileOps";
import { WorkCenterShareTarget } from "./WorkCenterShareTarget";
import { WorkCenterTemplates } from "./WorkCenterTemplates";
import { WorkCenterVoice } from "./WorkCenterVoice";
import { WorkCenterActions } from "./WorkCenterActions";
import { WorkCenterDataProcessing } from "./WorkCenterDataProcessing";
import { WorkCenterEvents } from "./WorkCenterEvents";
import { WorkCenterResults } from "./WorkCenterResults";
import { WorkCenterAttachments } from "./WorkCenterAttachments";
import { WorkCenterPrompts } from "./WorkCenterPrompts";
import { WorkCenterHistory } from "./WorkCenterHistory";

export class WorkCenterManager {
    private state: WorkCenterState;
    private deps: WorkCenterDependencies;

    // Sub-modules
    private ui: WorkCenterUI;
    private fileOps: WorkCenterFileOps;
    private shareTarget: WorkCenterShareTarget;
    private templates: WorkCenterTemplates;
    private voice: WorkCenterVoice;
    private actions: WorkCenterActions;
    private dataProcessing: WorkCenterDataProcessing;
    private attachments: WorkCenterAttachments;
    private prompts: WorkCenterPrompts;
    private results: WorkCenterResults;
    private history: WorkCenterHistory;
    private events: WorkCenterEvents;

    constructor(dependencies: WorkCenterDependencies) {
        this.deps = dependencies;
        this.state = WorkCenterStateManager.createDefaultState();

        // Initialize sub-modules
        this.dataProcessing = new WorkCenterDataProcessing();
        this.templates = new WorkCenterTemplates(dependencies);
        this.voice = new WorkCenterVoice(dependencies);
        this.fileOps = new WorkCenterFileOps(dependencies);
        this.history = new WorkCenterHistory(dependencies);
        this.attachments = new WorkCenterAttachments(dependencies, this.fileOps);
        this.prompts = new WorkCenterPrompts(dependencies, this.templates, this.voice);
        this.results = new WorkCenterResults(dependencies, this.dataProcessing);
        this.ui = new WorkCenterUI(dependencies, this.attachments, this.prompts, this.results, this.history);
        this.shareTarget = new WorkCenterShareTarget(dependencies, this.fileOps);
        this.actions = new WorkCenterActions(dependencies, this.ui, this.fileOps, this.dataProcessing, this.results, this.history);
        this.events = new WorkCenterEvents(
            dependencies,
            this.ui,
            this.fileOps,
            this.actions,
            this.templates,
            this.voice,
            this.shareTarget,
            this.history,
            this.attachments,
            this.prompts,
            this.state
        );

        // Initialize share target result listener
        this.shareTarget.initShareTargetListener(this.state);

        // Process any queued messages that were sent before work center was available
        this.shareTarget.processQueuedMessages(this.state);
    }

    // File handling methods - delegate to fileOps module
    async handleDroppedContent(content: string, sourceType: string): Promise<void> {
        return this.fileOps.handleDroppedContent(this.state, content, sourceType);
    }

    async handlePastedContent(content: string, sourceType: string): Promise<void> {
        return this.fileOps.handlePastedContent(this.state, content, sourceType);
    }


    getState(): WorkCenterState {
        return this.state;
    }

    destroy(): void {
        // Clear container references
        this.ui.setContainer(null);
        this.attachments.setContainer(null);
        this.prompts.setContainer(null);
        this.results.setContainer(null);
        this.history.setContainer(null);

        // The WorkCenterCommunicator handles its own cleanup
        // No need to manually close channels here
        console.log('[WorkCenter] WorkCenterManager destroyed');
    }

    renderWorkCenterView(): HTMLElement {
        const container = this.ui.renderWorkCenterView(this.state);

        // Set up event listeners
        this.events.setContainer(container);
        this.events.setupWorkCenterEvents();

        // Update file list, file counter, and recent history
        this.ui.updateFileList(this.state);
        this.ui.updateFileCounter(this.state);
        this.history.updateRecentHistory(this.state);

        return container;
    }

}
