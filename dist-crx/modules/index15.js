import { observe, H, loadSettings, ref, loadAsAdopted, affected, __vitePreload, removeAdopted } from './Settings.js';
import './Env.js';
import { createViewState } from './types.js';
import { addInstruction, addInstructions, setActiveInstruction, deleteInstruction, updateInstruction } from './CustomInstructions.js';
import { showError, showSuccess } from './Toast.js';
import { DEFAULT_INSTRUCTION_TEMPLATES } from './templates.js';

const workcenterStyles = "@layer view.workcenter{:is(html,body):has([data-view=workcenter]){--view-layout:\"grid\";--view-sidebar-visible:true;--view-toolbar-expanded:true;--view-content-max-width:none}.workcenter-view{background:var(--color-background);block-size:stretch;color:var(--color-on-background);container-type:inline-size;display:flex;flex-direction:column;gap:var(--space-md);max-block-size:stretch;min-block-size:stretch;overflow-x:hidden;overflow-y:auto;padding:var(--space-md);scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.workcenter-view button,.workcenter-view input,.workcenter-view select,.workcenter-view textarea{box-sizing:border-box;max-inline-size:stretch}.workcenter-view button{flex-wrap:nowrap;overflow:hidden;text-align:center;text-decoration:none;text-overflow:ellipsis;text-rendering:auto;text-shadow:none;text-transform:none;text-wrap:nowrap;white-space:nowrap}@container (max-width: 1024px){.workcenter-view{gap:var(--space-sm);padding:var(--space-sm)}}@container (max-width: 768px){.workcenter-view{gap:var(--space-xs);padding:var(--space-xs)}}.workcenter-view::-webkit-scrollbar{inline-size:4px}.workcenter-view::-webkit-scrollbar-track{background:#0000}.workcenter-view::-webkit-scrollbar-thumb{background:var(--color-outline-variant);border-radius:2px}.workcenter-view::-webkit-scrollbar-thumb:hover{background:var(--color-outline)}.workcenter-view:focus-visible{outline:2px solid var(--color-primary);outline-offset:-2px}.view-workcenter{--view-bg:light-dark(var(--color-surface,#fff),#121212);--view-fg:light-dark(var(--color-on-surface,#1a1a1a),#f2f2f2);--view-border:light-dark(#00000026,#ffffff26);--view-files-bg:light-dark(#00000005,#ffffff08);--view-file-bg:light-dark(#00000008,#ffffff0d);--view-input-bg:light-dark(#fff,#1b1b1b);--view-results-bg:light-dark(#00000003,#ffffff0a);--view-result-bg:light-dark(#00000008,#ffffff0f);--view-primary:var(--color-primary,#007acc);background-color:var(--view-bg);block-size:100%;color:var(--view-fg);display:flex;flex-direction:column}}@layer view.workcenter{.view-workcenter::-webkit-scrollbar{inline-size:4px}.view-workcenter__main{display:flex;flex:1;flex-direction:column;gap:1rem;overflow:hidden;overflow-x:hidden;overflow-y:auto;padding:1rem;scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.view-workcenter__input-area,.view-workcenter__prompt{display:flex;flex:1;flex-direction:column;gap:1rem;min-inline-size:0}.view-workcenter__prompt{gap:.5rem}.view-workcenter__prompt-input{background-color:var(--view-input-bg);border:1px solid var(--view-border);border-radius:8px;color:var(--view-fg);flex:1;font-family:inherit;font-size:.875rem;min-block-size:200px;padding:.75rem;resize:vertical}.view-workcenter__prompt-input:focus{border-color:var(--view-primary);outline:none}.view-workcenter__prompt-input::placeholder{color:var(--view-fg);opacity:.4}.view-workcenter__process-btn{align-items:center;background-color:var(--view-primary);border:none;border-radius:8px;color:#fff;cursor:pointer;display:flex;font-size:.875rem;font-weight:600;gap:.5rem;justify-content:center;padding:.75rem 1.5rem;transition:filter .15s ease}.view-workcenter__process-btn:hover{filter:brightness(1.1)}.view-workcenter__process-btn:disabled{cursor:not-allowed;opacity:.5}.view-workcenter__files,.view-workcenter__results{block-size:max-content;border-radius:12px;display:flex;flex:1;flex-direction:column;max-block-size:none;min-inline-size:0;padding:1rem}.view-workcenter__results{contain:inline-size layout paint style;max-block-size:600px;overflow:hidden;overflow-x:hidden;overflow-y:auto;scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.view-workcenter__files{background-color:var(--view-files-bg);border:2px dashed var(--view-border);cursor:pointer;gap:.5rem;max-block-size:none;transition:border-color .2s ease,background-color .2s ease}.view-workcenter__files.dragover,.view-workcenter__files:hover{background-color:#007acc0d;border-color:var(--view-primary)}.view-workcenter__files-header,.view-workcenter__result-header{align-items:center;display:flex;justify-content:space-between}.view-workcenter__files-header h3,.view-workcenter__results-header h3{font-size:.875rem;font-weight:600;margin:0}.view-workcenter__file-count,.view-workcenter__file-size,.view-workcenter__result-time{color:var(--view-fg);font-size:.75rem;opacity:.6}.view-workcenter__files-list{block-size:stretch;max-block-size:stretch;min-block-size:100px;overflow-y:auto}.view-workcenter__files-empty,.view-workcenter__results-empty{block-size:stretch;color:var(--view-fg);inline-size:stretch;opacity:.5;text-align:center}.view-workcenter__files-empty p,.view-workcenter__results-empty p{font-size:.875rem;margin:0}.view-workcenter__files-empty{align-items:center;display:flex;flex-direction:column;gap:.5rem;justify-content:center;padding:1.5rem}.view-workcenter__results-empty{align-items:center;block-size:100%;display:flex;justify-content:center;opacity:.4}.view-workcenter__file-item{align-items:center;background-color:var(--view-file-bg);border-radius:6px;display:flex;gap:.5rem;padding:.5rem}.view-workcenter__file-item ui-icon{flex-shrink:0;opacity:.7}.view-workcenter__file-name{flex:1;font-size:.8125rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.view-workcenter__file-remove,.view-workcenter__result-copy{align-items:center;background:#0000;border:none;border-radius:4px;color:var(--view-fg);cursor:pointer;display:flex;justify-content:center;opacity:.5}.view-workcenter__file-remove{block-size:20px;inline-size:20px}.view-workcenter__file-remove:hover{background-color:#ff00001a;color:#d32f2f;opacity:1}.view-workcenter__files-actions{display:flex;gap:.5rem}.view-workcenter__results{background-color:var(--view-results-bg);border:1px solid var(--view-border)}.view-workcenter__results-header{margin-block-end:.5rem}.view-workcenter__results-list{flex:1;overflow-y:auto}.view-workcenter__result-item{background-color:var(--view-result-bg);border-radius:8px;margin-block-end:.5rem;padding:.75rem}.view-workcenter__result-item.error{background-color:#d32f2f0d;border-inline-start:3px solid #d32f2f}.view-workcenter__result-header{margin-block-end:.5rem}.view-workcenter__result-copy{block-size:24px;inline-size:24px}.view-workcenter__result-copy:hover{background-color:light-dark(#0000000d,#ffffff14);opacity:1}.view-workcenter__result-content{font-size:.875rem;line-height:1.5;white-space:pre-wrap;word-break:break-word}.view-workcenter__btn{align-items:center;background:#0000;border:none;border-radius:6px;color:var(--view-fg);cursor:pointer;display:flex;font-size:.8125rem;font-weight:500;gap:.375rem;padding:.5rem .75rem;transition:background-color .15s ease}.view-workcenter__btn:hover{background-color:light-dark(#0000000f,#ffffff14)}.workcenter-content{block-size:stretch;box-sizing:border-box;flex:1;max-block-size:stretch}.workcenter-content,.workcenter-content .workcenter-layout{inline-size:stretch;max-inline-size:stretch;min-block-size:0}.workcenter-content .workcenter-layout{block-size:max-content;display:grid;gap:var(--space-lg);grid-auto-rows:minmax(0,max-content);grid-template-columns:minmax(0,1fr);max-block-size:none}@container (max-width: 1024px){.workcenter-content .workcenter-layout{gap:var(--space-md)}}@container (max-width: 768px){.workcenter-content .workcenter-layout{gap:var(--space-sm)}}.workcenter-content .workcenter-layout .workcenter-column{box-sizing:border-box;display:flex;flex-direction:column;gap:var(--space-md);inline-size:stretch;max-inline-size:stretch;min-block-size:0}.workcenter-content .workcenter-layout .workcenter-column.prompts-column{order:1}.workcenter-content .workcenter-layout .workcenter-column.results-column{order:2}.workcenter-content .workcenter-layout .workcenter-column.attachments-column,.workcenter-content .workcenter-layout .workcenter-column.inputs-column{order:3}.workcenter-content .workcenter-layout .workcenter-column .section-header{align-items:center;background:var(--color-surface-container-high);border-radius:var(--radius-md);display:grid;gap:var(--space-md,.75rem);grid-template-columns:minmax(0,1fr) minmax(0,max-content);grid-template-rows:minmax(max-content,1fr);inline-size:stretch;max-inline-size:stretch;min-inline-size:0;padding:var(--space-sm) var(--space-md)}@container (max-width: 768px){.workcenter-content .workcenter-layout .workcenter-column .section-header{gap:var(--space-sm);padding:var(--space-xs) var(--space-sm)}}@container (max-width: 480px){.workcenter-content .workcenter-layout .workcenter-column .section-header{grid-template-columns:1fr;justify-items:center}}.workcenter-content .workcenter-layout .workcenter-column .section-header h3{color:var(--color-on-surface);font-size:var(--text-base);font-weight:var(--font-weight-semibold);justify-self:start;letter-spacing:-.01em;margin:0;text-align:start}@container (max-width: 768px){.workcenter-content .workcenter-layout .workcenter-column .section-header h3{font-size:var(--text-sm)}}.workcenter-content .workcenter-layout .workcenter-column .section-header .file-actions,.workcenter-content .workcenter-layout .workcenter-column .section-header .input-actions,.workcenter-content .workcenter-layout .workcenter-column .section-header .output-actions,.workcenter-content .workcenter-layout .workcenter-column .section-header .prompt-actions,.workcenter-content .workcenter-layout .workcenter-column .section-header .result-actions{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-xs)}.workcenter-content .workcenter-layout .workcenter-column .section-header .file-actions .btn,.workcenter-content .workcenter-layout .workcenter-column .section-header .input-actions .btn,.workcenter-content .workcenter-layout .workcenter-column .section-header .output-actions .btn,.workcenter-content .workcenter-layout .workcenter-column .section-header .prompt-actions .btn,.workcenter-content .workcenter-layout .workcenter-column .section-header .result-actions .btn{font-size:var(--text-xs);padding:var(--space-xs) var(--space-sm)}.workcenter-content .workcenter-layout .workcenter-column .attachments-section,.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section,.workcenter-content .workcenter-layout .workcenter-column .prompts-section,.workcenter-content .workcenter-layout .workcenter-column .results-section{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-lg);box-sizing:border-box;display:flex;flex-direction:column;gap:var(--space-md);inline-size:stretch;max-inline-size:stretch;min-block-size:0;overflow:hidden;padding:var(--space-md)}@container (max-width: 1024px){.workcenter-content .workcenter-layout .workcenter-column .attachments-section,.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section,.workcenter-content .workcenter-layout .workcenter-column .prompts-section,.workcenter-content .workcenter-layout .workcenter-column .results-section{gap:var(--space-sm);padding:var(--space-sm)}}@container (max-width: 768px){.workcenter-content .workcenter-layout .workcenter-column .attachments-section,.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section,.workcenter-content .workcenter-layout .workcenter-column .prompts-section,.workcenter-content .workcenter-layout .workcenter-column .results-section{gap:var(--space-xs);padding:var(--space-xs)}}.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section .input-tab-actions{display:flex;flex-wrap:wrap;gap:var(--space-xs);justify-content:flex-end}.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section .tab-btn{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);cursor:pointer;font-size:var(--text-xs);padding:var(--space-xs) var(--space-sm)}.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section .tab-btn.is-active{background:var(--color-primary);border-color:var(--color-primary);color:var(--color-on-primary)}.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section .input-tab-panels{display:grid}.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section .tab-panel{display:none;min-inline-size:0}.workcenter-content .workcenter-layout .workcenter-column .input-tabs-section .tab-panel.is-active{display:block}@media (max-width:768px){.view-workcenter__main{flex-direction:column}}}@layer view.workcenter{.workcenter-header{align-items:center;background:light-dark(var(--color-surface-container-high),var(--color-surface-container-high));border-radius:var(--radius-md);display:flex;gap:var(--space-md);justify-content:space-between;padding:var(--space-sm) var(--space-md)}.workcenter-header h2{color:light-dark(var(--color-on-surface),var(--color-on-surface));font-size:var(--text-base);font-weight:var(--font-weight-bold);letter-spacing:-.01em;margin:0;white-space:nowrap}@container (max-width: 768px){.workcenter-header{align-items:stretch;flex-direction:column;gap:var(--space-sm);padding:var(--space-sm)}.workcenter-header h2{font-size:var(--text-sm);text-align:center}}@container (max-width: 480px){.workcenter-header{gap:var(--space-xs);padding:var(--space-xs)}}.control-selectors{align-items:center;background:light-dark(var(--color-surface-container-low),var(--color-surface-container-low));border-radius:var(--radius-sm);display:flex;gap:var(--space-md);padding:var(--space-xs) var(--space-sm)}@container (max-width: 1024px){.control-selectors{gap:var(--space-sm);padding:var(--space-xs)}}@container (max-width: 900px){.control-selectors{display:grid;gap:var(--space-sm);grid-template-columns:1fr 1fr}}@container (max-width: 768px){.control-selectors{gap:var(--space-xs);grid-template-columns:1fr}}@container (max-width: 480px){.control-selectors{gap:var(--space-xs);padding:var(--space-xs)}}.format-select,.language-select,.processing-select,.recognition-select{align-items:center;background:light-dark(var(--color-surface),var(--color-surface));border-radius:var(--radius-sm);color:light-dark(var(--color-on-surface),var(--color-on-surface));cursor:pointer;display:flex;flex:1;font-family:var(--font-family);font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-sm);min-width:80px;padding:var(--space-xs) var(--space-sm);width:100%}.format-select:hover,.language-select:hover,.processing-select:hover,.recognition-select:hover{background:light-dark(var(--color-surface-container-high),var(--color-surface-container-high));border-color:light-dark(var(--color-primary),var(--color-primary))}.format-select:focus,.language-select:focus,.processing-select:focus,.recognition-select:focus{border-color:light-dark(var(--color-primary),var(--color-primary));outline:none}.format-select:focus-visible,.language-select:focus-visible,.processing-select:focus-visible,.recognition-select:focus-visible{outline:2px solid light-dark(var(--color-primary),var(--color-primary));outline-offset:1px}.format-select option,.language-select option,.processing-select option,.recognition-select option{background:light-dark(var(--color-surface),var(--color-surface));color:light-dark(var(--color-on-surface),var(--color-on-surface))}@container (max-width: 900px){.format-select,.language-select,.processing-select,.recognition-select{align-items:stretch;flex-direction:column;font-size:var(--text-xs);gap:var(--space-xs);min-width:0;padding:var(--space-xs)}.format-select label,.language-select label,.processing-select label,.recognition-select label{font-size:var(--text-xs);justify-content:flex-start}}@container (max-width: 768px){.format-select,.language-select,.processing-select,.recognition-select{flex-direction:row;gap:var(--space-sm)}}@container (max-width: 640px){.format-select,.language-select,.processing-select,.recognition-select{flex-direction:column;gap:var(--space-xs);min-width:60px}}.format-select label,.language-select label,.processing-select label,.recognition-select label{color:light-dark(var(--color-on-surface),var(--color-on-surface));display:flex;flex-direction:row;flex-shrink:0;font-size:var(--text-sm);font-weight:var(--font-weight-medium);place-content:center;justify-content:center;place-items:center;white-space:nowrap}.prompt-section{border:none;border-radius:var(--radius-md,6px);padding:0;position:relative}}@layer view.workcenter{.prompt-section>:where(.file-input-area){inset:0;opacity:0;pointer-events:none;position:absolute;transition:all var(--motion-normal);visibility:hidden}.prompt-section .prompt-controls{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-md,.75rem);place-content:center;place-items:center}@container (max-width: 480px){.prompt-section .prompt-controls .btn-icon span{display:none}}.prompt-section .prompt-controls .icon-btn{align-items:center;background:var(--color-surface-container);block-size:40px;border:none;border-radius:var(--radius-sm,4px);color:var(--color-on-surface);cursor:pointer;display:flex;inline-size:40px;justify-content:center;transition:all var(--motion-fast,.14s ease)}.prompt-section .prompt-controls .icon-btn ui-icon{transition:color var(--motion-fast,.14s ease)}.prompt-section .prompt-controls .icon-btn:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-1)}.prompt-section .prompt-controls .icon-btn:hover ui-icon{color:var(--color-primary)}.prompt-section .prompt-controls .icon-btn:focus-visible{box-shadow:var(--focus-ring);outline:none}@container (max-width: 768px){.prompt-section .prompt-controls .icon-btn{block-size:36px;inline-size:36px}}@container (max-width: 480px){.prompt-section .prompt-controls .icon-btn{block-size:32px;inline-size:32px}}@container (max-width: 768px){.prompt-section .prompt-controls{gap:var(--space-sm,.5rem)}}@container (max-width: 480px){.prompt-section .prompt-controls{align-items:stretch;gap:var(--space-sm,.5rem)}}.template-select{background:var(--color-surface);border-radius:var(--radius-sm,4px);color:var(--color-on-surface);cursor:pointer;flex:1;font-family:var(--font-family);font-size:var(--text-sm,.875rem);font-weight:var(--font-weight-medium,500);min-height:36px;padding:var(--space-sm,.5rem) var(--space-md,.75rem)}.template-select:hover{background:var(--color-surface-container-high);border-color:var(--color-primary)}.template-select:focus{border-color:var(--color-primary);outline:none}@container (max-width: 768px){.template-select{min-height:40px}}.instruction-selector-row{align-items:center;display:flex;gap:var(--space-sm,.5rem);padding:var(--space-sm,.5rem) 0}.instruction-selector-row .instruction-label{align-items:center;color:var(--color-on-surface-variant);display:flex;flex-shrink:0;font-size:var(--text-xs,.75rem);font-weight:var(--font-weight-medium,500);gap:var(--space-xs,.25rem);white-space:nowrap}.instruction-selector-row .instruction-label ui-icon{color:var(--color-primary);opacity:.8}.instruction-selector-row .instruction-select{background:var(--color-surface);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm,4px);color:var(--color-on-surface);cursor:pointer;flex:1;font-family:var(--font-family);font-size:var(--text-xs,.75rem);min-height:30px;padding:var(--space-xs,.25rem) var(--space-sm,.5rem);transition:border-color var(--motion-fast,.14s ease)}.instruction-selector-row .instruction-select:hover{background:var(--color-surface-container-high);border-color:var(--color-primary)}.instruction-selector-row .instruction-select:focus{border-color:var(--color-primary);box-shadow:0 0 0 2px color-mix(in oklab,var(--color-primary) 15%,#0000);outline:none}.instruction-selector-row .btn-sm{align-items:center;background:#0000;border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm,4px);color:var(--color-on-surface-variant);cursor:pointer;display:flex;flex-shrink:0;justify-content:center;min-block-size:28px;min-inline-size:28px;padding:var(--space-xs,.25rem);transition:all var(--motion-fast,.14s ease)}.instruction-selector-row .btn-sm:hover{background:var(--color-surface-container-high);border-color:var(--color-primary);color:var(--color-primary)}@container (max-width: 480px){.instruction-selector-row{flex-wrap:wrap}.instruction-selector-row .instruction-label{flex-basis:100%}}.prompt-input{background:var(--color-surface);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);color:var(--color-on-surface);font-family:var(--font-family-system);font-size:var(--text-sm);inline-size:stretch;line-height:var(--leading-relaxed);min-block-size:5rem;padding:var(--space-sm) var(--space-md);resize:vertical;scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.prompt-input::placeholder{color:var(--color-on-surface-variant);opacity:.8}.prompt-input::-webkit-scrollbar{block-size:4px;inline-size:4px}.prompt-input::-webkit-scrollbar-thumb{background:var(--color-outline-variant)}.prompt-input:hover{background:var(--color-surface-container-low);box-shadow:var(--elev-1)}.prompt-input:focus{background:var(--color-surface-container-high);box-shadow:var(--focus-ring);outline:none}@container (max-width: 1024px){.prompt-input{min-block-size:4rem;padding:var(--space-sm)}}@container (max-width: 768px){.prompt-input{min-block-size:3.5rem;padding:var(--space-xs) var(--space-sm)}}.prompt-input-group{display:flex;flex-direction:column;gap:var(--space-xl,1.25rem)}.prompt-input-group[data-dropzone]{position:relative;transition:all var(--motion-normal)}.prompt-input-group .file-input-area{background:var(--color-surface-container-low);border:none;border-radius:var(--radius-md);box-shadow:var(--elev-1);inset:0;opacity:0;padding-block:var(--space-lg);padding-inline:var(--space-lg);pointer-events:none;position:absolute;transition:all var(--motion-normal);visibility:hidden;z-index:3}.prompt-input-group .file-input-area.drag-over{background:color-mix(in oklab,var(--color-primary) 10%,var(--color-surface-container-low));box-shadow:var(--focus-ring),var(--elev-2);opacity:1;visibility:visible}.prompt-input-group .file-input-area.drag-over .drop-zone-content{opacity:1;visibility:visible}@container (max-width: 1024px){.prompt-input-group .file-input-area{padding-block:var(--space-md);padding-inline:var(--space-md)}}@container (max-width: 768px){.prompt-input-group .file-input-area{padding-block:var(--space-sm);padding-inline:var(--space-sm)}}.prompt-input-group .file-drop-zone{align-items:center;display:flex;flex-direction:column;gap:var(--space-lg);position:relative;text-align:center}.prompt-input-group .file-drop-zone .drop-zone-content{align-items:center;display:flex;flex-direction:column;gap:var(--space-lg);justify-content:center;opacity:0;transition:all var(--motion-normal);visibility:hidden}.prompt-input-group .file-drop-zone .drop-zone-content .drop-icon{color:var(--color-primary);filter:drop-shadow(0 2px 8px rgba(0,0,0,.15));opacity:.8;transition:all var(--motion-normal)}@container (max-width: 1024px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-icon[size=\"4rem\"]{--icon-size:3.5rem;block-size:4rem;inline-size:4rem}}@container (max-width: 768px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-icon[size=\"4rem\"]{--icon-size:3rem;block-size:4rem;inline-size:4rem}}@container (max-width: 480px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-icon[size=\"4rem\"]{--icon-size:2.5rem;block-size:4rem;inline-size:4rem}}.prompt-input-group .file-drop-zone .drop-zone-content .drop-text{color:var(--color-on-surface);font-size:var(--text-xl);font-variant-emoji:text;font-weight:var(--font-weight-bold);letter-spacing:-.01em;line-height:var(--leading-tight);text-align:center}@container (max-width: 1024px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-text{font-size:var(--text-lg)}}@container (max-width: 768px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-text{font-size:var(--text-base)}}.prompt-input-group .file-drop-zone .drop-zone-content .drop-hint{color:var(--color-on-surface-variant);font-size:var(--text-sm);font-weight:var(--font-weight-medium);line-height:var(--leading-normal);max-width:280px;opacity:.9;text-align:center}@container (max-width: 768px){.prompt-input-group .file-drop-zone .drop-zone-content .drop-hint{font-size:var(--text-xs);max-width:240px}}@container (max-width: 1024px){.prompt-input-group .file-drop-zone .drop-zone-content{gap:var(--space-md)}}@container (max-width: 768px){.prompt-input-group .file-drop-zone .drop-zone-content{gap:var(--space-sm)}}.prompt-input-group .file-drop-zone .file-list{margin-top:var(--space-md)}.prompt-input-group .file-drop-zone .file-list .no-files{background:var(--color-surface-container-low);color:var(--color-on-surface-variant);font-size:var(--text-sm);padding:var(--space-lg);text-align:center}.prompt-input-group .file-drop-zone .file-list .file-item{align-items:center;background:var(--color-surface-container);border:none;border-radius:var(--radius-sm);box-shadow:var(--elev-0);display:flex;gap:var(--space-sm);margin-bottom:var(--space-xs);padding:var(--space-sm) var(--space-md)}.prompt-input-group .file-drop-zone .file-list .file-item:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-1)}.prompt-input-group .file-drop-zone .file-list .file-item:last-child{margin-bottom:0}.prompt-input-group .file-drop-zone .file-list .file-item .file-info{align-items:center;display:flex;flex:1;gap:var(--space-md)}.prompt-input-group .file-drop-zone .file-list .file-item .file-info .file-icon{align-items:center;background:var(--color-surface-container-high);border-radius:var(--radius-sm);display:flex;height:32px;justify-content:center;width:32px}.prompt-input-group .file-drop-zone .file-list .file-item .file-info .file-icon ui-icon{color:var(--color-primary)}@container (max-width: 768px){.prompt-input-group .file-drop-zone .file-list .file-item .file-info .file-icon ui-icon[size=\"20\"]{--icon-size:16px;block-size:20px;inline-size:20px}.prompt-input-group .file-drop-zone .file-list .file-item .file-info .file-icon{block-size:28px;inline-size:28px}}.prompt-input-group .file-drop-zone .file-list .file-item .file-info .file-name{color:var(--color-on-surface);flex:1;font-size:var(--text-sm);font-weight:var(--font-weight-semibold);line-height:var(--leading-tight);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@container (max-width: 768px){.prompt-input-group .file-drop-zone .file-list .file-item .file-info .file-name{font-size:var(--text-xs)}}.prompt-input-group .file-drop-zone .file-list .file-item .file-info .file-size{color:var(--color-on-surface-variant);font-size:var(--text-xs);font-weight:var(--font-weight-medium)}@container (max-width: 768px){.prompt-input-group .file-drop-zone .file-list .file-item .file-info{gap:var(--space-sm)}}.prompt-input-group .file-drop-zone .file-list .file-item .remove-btn{align-items:center;background:#0000;border:none;color:var(--color-error);cursor:pointer;display:flex;font-size:var(--text-sm);height:24px;justify-content:center;width:24px}.prompt-input-group .file-drop-zone .file-list .file-item .remove-btn:hover{background:color-mix(in oklab,var(--color-error) 20%,#0000)}.prompt-input-group .recognized-status{align-items:center;background:color-mix(in oklab,var(--color-success) 5%,#0000);border:none;border-radius:var(--radius-lg);box-shadow:var(--elev-1);color:var(--color-on-surface);display:flex;font-size:var(--text-sm);gap:var(--space-sm);margin-top:var(--space-md);padding:var(--space-sm) var(--space-md)}.prompt-input-group .recognized-status .status-icon{color:var(--color-success);flex-shrink:0}.prompt-input-group .recognized-status .clear-recognized{background:#0000;border:none;border-radius:var(--radius-full);box-shadow:none;color:var(--color-on-surface-variant);font-size:var(--text-xs);margin-left:auto;min-height:28px;padding:var(--space-xs) var(--space-sm)}.prompt-input-group .recognized-status .clear-recognized:hover{background:color-mix(in oklab,var(--color-error) 5%,#0000);color:var(--color-error)}@container (max-width: 1024px){.prompt-input-group{gap:var(--space-lg,1rem)}}@container (max-width: 768px){.prompt-input-group{gap:var(--space-md,.75rem)}}.action-section,.prompts-section{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-lg,12px);padding:var(--space-lg,1rem);place-content:center;place-items:center;align-items:stretch}.action-section .prompt-actions,.prompts-section .prompt-actions{display:grid;gap:var(--space-md,.75rem);grid-template-columns:minmax(0,1fr) minmax(0,max-content);grid-template-rows:minmax(max-content,1fr) minmax(max-content,1fr);inline-size:max(60cqi,min(24rem,100%));max-inline-size:stretch;min-inline-size:max-content;place-content:stretch;place-items:center;place-self:center}.action-section .prompt-actions .voice-btn,.prompts-section .prompt-actions .voice-btn{align-items:center;background:var(--color-surface-container-high);border:none;border-radius:var(--radius-xl,12px);box-shadow:var(--elev-0);color:var(--color-on-surface);cursor:pointer;display:flex;font-size:var(--text-sm,.875rem);font-weight:var(--font-weight-medium,500);grid-column:1;grid-row:1;inline-size:stretch;justify-content:center;min-block-size:44px;padding:var(--space-lg,1rem);transition:all var(--motion-normal,.16s ease)}.action-section .prompt-actions .voice-btn:hover,.prompts-section .prompt-actions .voice-btn:hover{background:var(--color-surface-container-highest);box-shadow:var(--elev-1)}.action-section .prompt-actions .voice-btn:focus,.prompts-section .prompt-actions .voice-btn:focus{box-shadow:var(--focus-ring);outline:none}.action-section .prompt-actions .voice-btn.recording,.prompts-section .prompt-actions .voice-btn.recording{animation:pulse 1.5s infinite;background:var(--color-error);color:var(--color-on-error)}.action-section .prompt-actions .voice-btn.recording:before,.prompts-section .prompt-actions .voice-btn.recording:before{animation:blink 1s infinite;color:var(--color-on-error);content:\"●\";margin-right:var(--space-sm,.5rem)}@container (max-width: 768px){.action-section .prompt-actions .voice-btn,.prompts-section .prompt-actions .voice-btn{font-size:var(--text-xs,.75rem);min-block-size:40px}}@container (max-width: 480px){.action-section .prompt-actions .voice-btn,.prompts-section .prompt-actions .voice-btn{min-block-size:36px;padding:var(--space-sm,.5rem)}}.action-section .prompt-actions .auto-action-label,.prompts-section .prompt-actions .auto-action-label{background:var(--color-surface-container);block-size:44px;border:none;border-radius:var(--radius-lg,12px);box-shadow:var(--elev-0);cursor:pointer;display:flex;grid-column:2;grid-row:1;inline-size:44px;place-content:center;justify-content:center;padding:.5rem;place-items:center;transition:all var(--motion-fast,.14s ease)}.action-section .prompt-actions .auto-action-label>:not(ui-icon),.prompts-section .prompt-actions .auto-action-label>:not(ui-icon){display:none}.action-section .prompt-actions .auto-action-label ui-icon,.prompts-section .prompt-actions .auto-action-label ui-icon{color:var(--color-on-surface-variant);transition:all var(--motion-fast,.14s ease)}.action-section .prompt-actions .auto-action-label input[type=checkbox],.prompts-section .prompt-actions .auto-action-label input[type=checkbox]{height:1px;margin:-1px;opacity:0;overflow:hidden;padding:0;position:absolute;width:1px;clip:rect(0,0,0,0);border:0;white-space:nowrap}.action-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked),.prompts-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked),input[type=checkbox]:checked~.action-section .prompt-actions .auto-action-label,input[type=checkbox]:checked~.prompts-section .prompt-actions .auto-action-label{background:var(--color-primary);box-shadow:var(--elev-1)}.action-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked) ui-icon,.prompts-section .prompt-actions .auto-action-label:has(input[type=checkbox]:checked) ui-icon,input[type=checkbox]:checked~.action-section .prompt-actions .auto-action-label ui-icon,input[type=checkbox]:checked~.prompts-section .prompt-actions .auto-action-label ui-icon{color:var(--color-on-primary)}.action-section .prompt-actions .auto-action-label:hover,.prompts-section .prompt-actions .auto-action-label:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-1)}.action-section .prompt-actions .auto-action-label:hover:has(input[type=checkbox]:checked),.prompts-section .prompt-actions .auto-action-label:hover:has(input[type=checkbox]:checked),input[type=checkbox]:checked~.action-section .prompt-actions .auto-action-label:hover,input[type=checkbox]:checked~.prompts-section .prompt-actions .auto-action-label:hover{background:color-mix(in oklab,var(--color-primary) 90%,#000)}.action-section .prompt-actions .auto-action-label:focus-within,.prompts-section .prompt-actions .auto-action-label:focus-within{box-shadow:var(--focus-ring);outline:none}@container (max-width: 768px){.action-section .prompt-actions .auto-action-label,.prompts-section .prompt-actions .auto-action-label{block-size:40px;inline-size:40px}.action-section .prompt-actions .auto-action-label ui-icon[size=\"20\"],.prompts-section .prompt-actions .auto-action-label ui-icon[size=\"20\"]{--size:18px}}@container (max-width: 480px){.action-section .prompt-actions .auto-action-label,.prompts-section .prompt-actions .auto-action-label{block-size:36px;inline-size:36px}.action-section .prompt-actions .auto-action-label ui-icon[size=\"20\"],.prompts-section .prompt-actions .auto-action-label ui-icon[size=\"20\"]{--size:16px}}.action-section .prompt-actions .action-btn,.prompts-section .prompt-actions .action-btn{align-items:center;background:var(--color-primary);border:none;border-radius:var(--radius-md,6px);color:var(--color-on-primary);cursor:pointer;display:flex;font-size:var(--text-sm,.875rem);font-weight:var(--font-weight-medium,500);gap:var(--space-xs,.25rem);grid-column:1;grid-row:2;inline-size:stretch;justify-content:center;max-inline-size:stretch;min-block-size:44px;padding:var(--space-md,.75rem) var(--space-lg,1rem);transition:all var(--motion-normal,.16s ease)}.action-section .prompt-actions .action-btn:hover,.prompts-section .prompt-actions .action-btn:hover{background:color-mix(in oklab,var(--color-primary) 85%,#000);box-shadow:var(--elev-1);transform:translateY(-1px)}.action-section .prompt-actions .action-btn:focus,.prompts-section .prompt-actions .action-btn:focus{box-shadow:var(--focus-ring);outline:none}.action-section .prompt-actions .action-btn:disabled,.prompts-section .prompt-actions .action-btn:disabled{background:var(--color-surface-container-high);box-shadow:var(--elev-0);color:var(--color-on-surface-variant);cursor:not-allowed;transform:none}@container (max-width: 768px){.action-section .prompt-actions .action-btn ui-icon[size=\"20\"],.prompts-section .prompt-actions .action-btn ui-icon[size=\"20\"]{--icon-size:16px}}@container (max-width: 640px){.action-section .prompt-actions .action-btn .btn-text,.prompts-section .prompt-actions .action-btn .btn-text{display:none}}@container (max-width: 768px){.action-section .prompt-actions .action-btn,.prompts-section .prompt-actions .action-btn{min-block-size:40px;padding:var(--space-sm,.5rem) var(--space-md,.75rem)}}@container (max-width: 480px){.action-section .prompt-actions .action-btn,.prompts-section .prompt-actions .action-btn{font-size:var(--text-xs,.75rem);min-block-size:36px;padding:var(--space-xs,.25rem) var(--space-sm,.5rem)}}.action-section .prompt-actions .clear-btn,.prompts-section .prompt-actions .clear-btn{align-items:center;aspect-ratio:1/1;background:var(--color-surface-container);block-size:stretch;border:none;border-radius:var(--radius-md,6px);color:var(--color-on-surface);cursor:pointer;display:flex;grid-column:2;grid-row:2;inline-size:stretch;justify-content:center;max-block-size:stretch;max-inline-size:stretch;min-block-size:44px;min-inline-size:44px;transition:all var(--motion-fast,.14s ease)}.action-section .prompt-actions .clear-btn:hover,.prompts-section .prompt-actions .clear-btn:hover{background:var(--color-error-container);color:var(--color-on-error-container)}.action-section .prompt-actions .clear-btn:focus,.prompts-section .prompt-actions .clear-btn:focus{box-shadow:var(--focus-ring);outline:none}@container (max-width: 768px){.action-section .prompt-actions .clear-btn,.prompts-section .prompt-actions .clear-btn{min-block-size:40px;min-inline-size:40px}}@container (max-width: 480px){.action-section .prompt-actions .clear-btn,.prompts-section .prompt-actions .clear-btn{min-block-size:36px;min-inline-size:36px}}@container (max-width: 1024px){.action-section,.prompts-section{padding:var(--space-md,.75rem)}}@container (max-width: 768px){.action-section,.prompts-section{padding:var(--space-sm,.5rem)}}.section-header .prompt-actions{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-xs,.25rem)}.instruction-panel,.prompt-panel{display:flex;flex-direction:column;gap:var(--space-md)}.instruction-panel .instruction-help{background:var(--color-surface-container-high);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);font-size:var(--text-xs);padding:var(--space-sm)}.prompt-panel .prompt-actions{align-items:center;display:grid;gap:var(--space-sm);grid-template-columns:max-content minmax(0,1fr) max-content max-content max-content}.prompt-attach-btn{align-items:center;background:var(--color-surface-container);border:1px solid var(--color-outline-variant);display:inline-flex;gap:var(--space-xs);justify-content:center;min-block-size:44px;min-inline-size:44px}.prompt-attach-btn .attach-count{background:var(--color-primary-container);border-radius:var(--radius-full);color:var(--color-primary);font-size:var(--text-xs);font-weight:var(--font-weight-semibold);min-inline-size:1.35rem;padding:0 .35rem;text-align:center}.prompt-input-group[data-prompt-dropzone]{border:2px dashed #0000;border-radius:var(--radius-md);position:relative;transition:border-color var(--motion-fast),background-color var(--motion-fast)}.prompt-input-group[data-prompt-dropzone].drag-over{background:color-mix(in oklab,var(--color-primary) 7%,#0000);border-color:var(--color-primary)}.prompt-input-overlay{align-items:center;background:color-mix(in oklab,var(--color-primary) 12%,var(--color-surface-container-high));border-radius:var(--radius-sm);color:var(--color-on-surface);display:flex;gap:var(--space-xs);inset:var(--space-xs);justify-content:center;opacity:0;pointer-events:none;position:absolute;transition:opacity var(--motion-fast),visibility var(--motion-fast);visibility:hidden;z-index:2}.prompt-input-overlay.visible{opacity:1;visibility:visible}.file-attachment-area{flex:1;min-block-size:0}.file-attachment-area,.file-drop-zone{display:flex;flex-direction:column;gap:var(--space-md)}.file-drop-zone{align-items:center;border-radius:var(--radius-lg);cursor:pointer;justify-content:center;min-block-size:8rem;overflow:auto;position:relative;transition:all var(--motion-normal)}.file-drop-zone[data-dropzone]{background:var(--color-surface-container-low);border:2px dashed color-mix(in oklab,var(--color-outline-variant) 40%,#0000);min-block-size:8rem;padding:var(--space-lg)}.file-drop-zone[data-dropzone]:hover{background:color-mix(in oklab,var(--color-primary) 5%,var(--color-surface-container-low));border-color:color-mix(in oklab,var(--color-primary) 40%,#0000)}.file-drop-zone[data-dropzone].drag-over{background:color-mix(in oklab,var(--color-primary) 10%,var(--color-surface-container-low));border-color:var(--color-primary);box-shadow:var(--focus-ring)}.file-drop-zone[data-dropzone].drag-over:before{background:linear-gradient(45deg,color-mix(in oklab,var(--color-primary) 5%,#0000) 25%,#0000 25%,#0000 50%,color-mix(in oklab,var(--color-primary) 5%,#0000) 50%,color-mix(in oklab,var(--color-primary) 5%,#0000) 75%,#0000 75%);background-size:20px 20px;border-radius:inherit;content:\"\";inset:0;pointer-events:none;position:absolute;z-index:1}.file-drop-zone[data-dropzone].drag-over>*{position:relative;z-index:2}.drop-zone-content{align-items:center;block-size:max-content;display:flex;flex-direction:column;gap:var(--space-md);text-align:center}.drop-icon{color:var(--color-primary);opacity:.7}.drop-text{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:500}.drop-hint{color:var(--color-on-surface-variant);font-size:var(--text-sm);opacity:.8}.file-list{flex:1;max-block-size:300px;min-block-size:0;overflow-y:auto}.file-item{align-items:center;background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);display:flex;gap:var(--space-sm);margin-bottom:var(--space-xs);padding:var(--space-sm)}.file-item:hover{background:var(--color-surface-container-highest)}.file-info{align-items:center;display:flex;flex:1;gap:var(--space-sm);min-width:0}.file-icon,.file-preview{flex-shrink:0}.file-preview{border-radius:var(--radius-sm);height:32px;object-fit:cover;width:32px}.file-details{flex:1;min-width:0}.file-name{color:var(--color-on-surface);font-size:var(--text-sm);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-size,.file-type{color:var(--color-on-surface-variant);font-size:var(--text-xs)}.remove-btn{background:var(--color-error-container);border:none;border-radius:var(--radius-sm);color:var(--color-on-error-container);cursor:pointer;flex-shrink:0;font-size:var(--text-sm);line-height:1;padding:var(--space-xs)}.remove-btn:hover{background:var(--color-error);color:var(--color-on-error)}.file-actions{align-items:center;display:flex;gap:var(--space-md,.75rem);inline-size:stretch;justify-content:space-between;max-inline-size:stretch;min-inline-size:max-content;place-self:center}.file-stats{align-items:center;background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);display:flex;flex-wrap:wrap;gap:var(--space-sm);padding:var(--space-sm)}.file-stats .data-counter,.file-stats .file-counter{align-items:center;border-radius:var(--radius-md);display:inline-flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-xs);inline-size:max-content;padding:var(--space-xs) var(--space-sm)}.file-stats .data-counter .count,.file-stats .file-counter .count{min-inline-size:1ch;text-align:center}.file-stats .file-counter{background:var(--color-surface-container-high);border:1px solid color-mix(in oklab,var(--color-outline-variant) 30%,#0000);color:var(--color-on-surface-variant);min-inline-size:calc-size(fit-content,max(size,25px) + .5rem + var(--icon-size,1rem))}.file-stats .file-counter ui-icon{color:var(--color-primary);opacity:.8}.file-stats .file-counter .count{color:var(--color-primary);font-weight:600}.file-stats .file-counter .label{font-size:var(--text-xs)}}@layer view.workcenter{.file-stats .file-counter:has(.count:empty),.file-stats .file-counter:has(.count:not([data-count]):not(:has-text):not([data-count=\"0\"]):not(:has(.count:empty))){display:none}.file-stats .data-counter{min-inline-size:1.5rem}.file-stats .data-counter ui-icon{font-size:var(--text-sm)}.file-stats .data-counter.recognized{background:var(--color-secondary-container);border:1px solid var(--color-secondary)}.file-stats .data-counter.recognized,.file-stats .data-counter.recognized ui-icon{color:var(--color-on-secondary-container)}.file-stats .data-counter.processed{background:var(--color-tertiary-container);border:1px solid var(--color-tertiary)}.file-stats .data-counter.processed,.file-stats .data-counter.processed ui-icon{color:var(--color-on-tertiary-container)}.recognized-status{align-items:center;background:color-mix(in oklab,var(--color-tertiary) 10%,var(--color-surface-container-high));border:1px solid color-mix(in oklab,var(--color-tertiary) 30%,#0000);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);display:flex;font-size:var(--text-sm);gap:var(--space-sm);padding:var(--space-sm)}.recognized-status .status-icon{color:var(--color-tertiary);flex-shrink:0}.recognized-status .clear-recognized{background:var(--color-tertiary-container);border:none;border-radius:var(--radius-sm);color:var(--color-on-tertiary-container);cursor:pointer;font-size:var(--text-xs);margin-left:auto;padding:var(--space-xs) var(--space-sm)}.recognized-status .clear-recognized:hover{background:var(--color-tertiary);color:var(--color-on-tertiary)}.output-section{min-block-size:0}.output-content,.output-section{display:flex;flex-direction:column;gap:var(--space-md);overflow:auto}.output-content{border-radius:var(--radius-md);min-block-size:6rem;position:relative;transition:all var(--motion-normal)}.output-content:has(.result-content){min-block-size:10rem}.output-content[data-dropzone]{background:var(--color-surface-container-low);border:2px dashed color-mix(in oklab,var(--color-outline-variant) 30%,#0000);min-block-size:6rem;padding:var(--space-md)}.output-content[data-dropzone]:has(.result-content){border-color:var(--color-outline-variant);border-style:solid;min-block-size:10rem}.output-content[data-dropzone]:hover{background:color-mix(in oklab,var(--color-primary) 5%,var(--color-surface-container-low));border-color:color-mix(in oklab,var(--color-primary) 40%,#0000)}.output-content[data-dropzone].drag-over{background:color-mix(in oklab,var(--color-primary) 10%,var(--color-surface-container-low));border-color:var(--color-primary);box-shadow:var(--focus-ring)}.output-content[data-dropzone].drag-over:before{background:linear-gradient(45deg,color-mix(in oklab,var(--color-primary) 5%,#0000) 25%,#0000 25%,#0000 50%,color-mix(in oklab,var(--color-primary) 5%,#0000) 50%,color-mix(in oklab,var(--color-primary) 5%,#0000) 75%,#0000 75%);background-size:20px 20px;border-radius:inherit;content:\"\";inset:0;pointer-events:none;position:absolute;z-index:1}.output-content[data-dropzone].drag-over>*{position:relative;z-index:2}.history-section .result-actions,.output-actions,.pipeline-actions,.step-actions{align-items:center;display:flex;gap:var(--space-xs)}.output-actions .btn,.pipeline-actions .btn{font-size:var(--text-sm);min-inline-size:auto;padding:var(--space-xs) var(--space-sm)}.step-actions{margin-top:var(--space-xs)}.step-actions .btn{font-size:var(--text-xs);min-inline-size:auto;padding:var(--space-xs) var(--space-sm)}.history-section{display:flex;flex-direction:column;gap:var(--space-sm)}.history-section .result-actions .btn{font-size:var(--text-xs);min-inline-size:auto;padding:var(--space-xs) var(--space-sm)}.result-content{background:var(--color-surface-container-high);border-radius:var(--radius-md);color:var(--color-on-surface);font-family:var(--font-family);line-height:1.6;overflow-wrap:break-word;padding:var(--space-md);word-wrap:break-word}.result-content pre{background:var(--color-surface-container-low);border:1px solid var(--color-outline);border-radius:var(--radius-sm);font-family:var(--font-family-mono);font-size:var(--text-sm);line-height:1.4;margin:var(--space-sm) 0;overflow-x:auto;padding:var(--space-sm)}.result-content pre code{background:#0000;border:none;border-radius:0;font-size:inherit;padding:0}.result-content code{background:var(--color-surface-container-low);border:1px solid var(--color-outline);border-radius:var(--radius-sm);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:.875em;padding:.125em .25em}.result-content .katex{font-size:1em}.result-content .katex-display{margin:var(--space-md) 0;text-align:center}.result-content table{background:var(--color-surface-container-high);border:1px solid var(--color-outline);border-collapse:collapse;border-radius:var(--radius-md);margin:var(--space-md) 0;overflow:hidden;width:100%}.result-content table td,.result-content table th{border-bottom:1px solid var(--color-outline);border-right:1px solid var(--color-outline);padding:var(--space-sm);text-align:left}.result-content table td:last-child,.result-content table th:last-child{border-right:none}.result-content table th{background:var(--color-surface-container-low);color:var(--color-on-surface);font-weight:600}.result-content table tr:last-child td{border-bottom:none}.result-content ol,.result-content ul{margin:var(--space-sm) 0;padding-left:var(--space-lg)}.result-content ol li,.result-content ul li{line-height:1.6;margin:var(--space-xs) 0}.result-content blockquote{background:color-mix(in oklab,var(--color-primary) 5%,var(--color-surface-container-low));border-left:4px solid var(--color-primary);border-radius:0 var(--radius-sm) var(--radius-sm) 0;color:var(--color-on-surface-variant);font-style:italic;margin:var(--space-md) 0;padding:var(--space-sm) var(--space-md)}.result-content a{color:var(--color-primary);text-decoration:underline}.result-content a:hover{background:color-mix(in oklab,var(--color-primary) 10%,#0000);color:var(--color-primary-container)}.result-content a:focus{outline:2px solid var(--color-primary);outline-offset:2px}.result-content img{border-radius:var(--radius-sm);height:auto;margin:var(--space-sm) 0;max-width:100%}.result-content h1,.result-content h2,.result-content h3,.result-content h4,.result-content h5,.result-content h6{color:var(--color-on-surface);line-height:1.3;margin:var(--space-lg) 0 var(--space-sm)}.result-content h1:first-child,.result-content h2:first-child,.result-content h3:first-child,.result-content h4:first-child,.result-content h5:first-child,.result-content h6:first-child{margin-top:0}.result-content h1{font-size:var(--text-3xl);font-weight:700}.result-content h2{font-size:var(--text-2xl);font-weight:600}.result-content h3{font-size:var(--text-xl);font-weight:600}.result-content h4{font-size:var(--text-lg);font-weight:600}.result-content h5{font-size:var(--text-base);font-weight:600}.result-content h6{font-size:var(--text-sm);font-weight:600}.result-content p{margin:var(--space-sm) 0}.result-content p:first-child{margin-top:0}.result-content p:last-child{margin-bottom:0}.result-content hr{border:none;border-top:1px solid var(--color-outline);margin:var(--space-lg) 0}.code-result,.raw-result{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:var(--text-sm);line-height:1.5;margin:0;overflow:auto;padding:var(--space-md);white-space:pre}.data-pipeline-section{border-top:1px solid var(--color-outline-variant);margin-top:var(--space-md);padding-top:var(--space-md)}.pipeline-header{align-items:center;display:flex;gap:var(--space-sm);justify-content:space-between;margin-bottom:var(--space-md)}.pipeline-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:600;margin:0}.pipeline-step,.pipeline-steps{display:flex;flex-direction:column;gap:var(--space-sm)}.pipeline-step{background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);padding:var(--space-sm);transition:all var(--motion-fast)}.pipeline-step:hover{background:var(--color-surface-container-highest);border-color:var(--color-primary)}.pipeline-step.recognized-step{background:color-mix(in oklab,var(--color-tertiary) 5%,var(--color-surface-container-high));border-color:var(--color-tertiary)}.pipeline-step.processed-step{background:color-mix(in oklab,var(--color-secondary) 5%,var(--color-surface-container-high));border-color:var(--color-secondary)}.step-header{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-sm)}.step-icon{color:var(--color-primary);flex-shrink:0}.step-title{color:var(--color-on-surface);flex:1;font-size:var(--text-sm);font-weight:600}.step-format,.step-source,.step-time{color:var(--color-on-surface-variant);font-size:var(--text-xs)}.step-content{border-left:2px solid var(--color-outline);padding-left:var(--space-lg)}.step-preview{color:var(--color-on-surface-variant);display:-webkit-box;font-size:var(--text-sm);-webkit-line-clamp:3;line-height:1.4;-webkit-box-orient:vertical;overflow:hidden}.history-header{align-items:center;background:var(--color-surface-container-high);border-radius:var(--radius-md);display:grid;gap:var(--space-md);grid-template-columns:1fr max-content;padding:var(--space-sm) var(--space-md)}.history-header h4{color:var(--color-on-surface);font-size:var(--text-base);font-weight:var(--font-weight-semibold);letter-spacing:-.01em;margin:0}.recent-history{display:flex;flex-direction:column;gap:var(--space-xs);max-block-size:300px;overflow-y:auto}.history-item-compact{align-items:center;background:var(--color-surface-container-high);border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);display:flex;gap:var(--space-sm);justify-content:space-between;padding:var(--space-sm);transition:all var(--motion-fast)}.history-item-compact:hover{background:var(--color-surface-container-highest);border-color:var(--color-primary)}.history-meta{align-items:center;display:flex;flex:1;gap:var(--space-sm);min-width:0}.history-status{flex-shrink:0;font-size:var(--text-sm);font-weight:600}.history-status.success{color:var(--color-tertiary)}.history-status.error{color:var(--color-error)}.history-prompt{color:var(--color-on-surface);flex:1;font-size:var(--text-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.history-time{flex-shrink:0;font-size:var(--text-xs)}.history-time,.processing{color:var(--color-on-surface-variant)}.processing{align-items:center;display:flex;font-size:var(--text-base);gap:var(--space-sm);justify-content:center;padding:var(--space-xl)}.processing:before{animation:h 1s linear infinite;border:2px solid var(--color-primary);border-radius:50%;border-top:2px solid #0000;content:\"\";height:20px;width:20px}.error{background:color-mix(in oklab,var(--color-error) 10%,var(--color-surface-container-high));border:1px solid var(--color-error);border-radius:var(--radius-md);color:var(--color-error);font-size:var(--text-sm);padding:var(--space-md)}.empty-results,.no-files,.no-history{align-items:center;color:var(--color-on-surface-variant);display:flex;font-size:var(--text-sm);font-style:italic;justify-content:center;padding:var(--space-lg)}.empty-results{font-size:var(--text-base);padding:var(--space-xl)}}@layer view.workcenter{@container (max-width: 768px){.result-content{padding:var(--space-sm)}.step-header{align-items:flex-start;flex-direction:column;gap:var(--space-xs)}.history-header h4{font-size:var(--text-sm)}}}@layer view.workcenter.animations{@keyframes h{to{transform:rotate(1turn)}}}@layer view.workcenter{.workcenter-view{animation:fadeIn .3s ease-out}.action-details-modal,.action-history-modal,.template-editor-modal{align-items:center;display:flex;inset:0;justify-content:center;padding:var(--space-md);position:fixed;z-index:4}.action-details-modal,.action-history-modal{background:#00000080}.template-editor-modal{animation:fadeIn var(--motion-fast,.14s) ease;backdrop-filter:blur(4px);background:color-mix(in oklab,#000 40%,#0000)}.action-details-modal .modal-content,.action-history-modal .modal-content,.template-editor-modal .modal-content{background:var(--color-surface-container-high);border-radius:var(--radius-lg);box-shadow:var(--elev-4);display:flex;flex-direction:column;inline-size:100%;max-block-size:80vh;overflow:hidden}.action-details-modal .modal-content,.action-history-modal .modal-content{max-inline-size:90vw}.action-details-modal .modal-header,.action-history-modal .modal-header{align-items:center;background:var(--color-surface-container-low);border-bottom:1px solid var(--color-outline-variant);display:flex;justify-content:space-between;padding:var(--space-lg)}.action-details-modal .modal-header h3,.action-history-modal .modal-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0}.action-details-modal .modal-header .modal-actions,.action-history-modal .modal-header .modal-actions{align-items:center;display:flex;gap:var(--space-sm)}.action-details-modal .modal-body,.action-history-modal .modal-body{flex:1;overflow-y:auto;padding:var(--space-lg)}@container (max-width: 768px){.action-details-modal .modal-content,.action-history-modal .modal-content{max-block-size:90vh;max-inline-size:95vw}}.template-editor-modal .modal-content{animation:slideInUp var(--motion-normal,.2s) ease;max-inline-size:640px;padding:var(--space-xl,1.25rem)}@container (max-width: 768px){.template-editor-modal .modal-content{max-block-size:90vh;max-inline-size:95vw;padding:var(--space-lg,1rem)}}.template-editor-modal .modal-content .modal-header{display:grid;gap:var(--space-xs,.25rem);margin-block-end:var(--space-lg,1rem)}.template-editor-modal .modal-content .modal-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0}.template-editor-modal .modal-content .modal-header .modal-desc{color:var(--color-on-surface-variant);font-size:var(--text-xs,.75rem);line-height:1.5;margin:0;opacity:.85}.template-editor-modal .modal-content>h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-lg) 0}.template-editor-modal .modal-content .template-list{display:flex;flex:1;flex-direction:column;gap:var(--space-md);overflow-y:auto;scrollbar-color:var(--color-outline-variant) #0000;scrollbar-width:thin}.template-editor-modal .modal-content .template-list .template-item{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);transition:border-color var(--motion-fast,.14s)}.template-editor-modal .modal-content .template-list .template-item:hover{border-color:var(--color-primary)}.template-editor-modal .modal-content .template-list .template-item .template-item-header{align-items:center;display:flex;gap:var(--space-sm)}.template-editor-modal .modal-content .template-list .template-item input,.template-editor-modal .modal-content .template-list .template-item textarea{background:var(--color-surface);border:1px solid var(--color-outline);border-radius:var(--radius-sm);color:var(--color-on-surface);font-family:inherit;font-size:var(--text-sm);padding:var(--space-sm);transition:border-color var(--motion-fast,.14s)}.template-editor-modal .modal-content .template-list .template-item input:focus,.template-editor-modal .modal-content .template-list .template-item textarea:focus{border-color:var(--color-primary);box-shadow:0 0 0 2px color-mix(in oklab,var(--color-primary) 20%,#0000);outline:none}.template-editor-modal .modal-content .template-list .template-item input::placeholder,.template-editor-modal .modal-content .template-list .template-item textarea::placeholder{color:var(--color-on-surface-variant);opacity:.6}.template-editor-modal .modal-content .template-list .template-item input{flex:1;font-weight:var(--font-weight-medium)}.template-editor-modal .modal-content .template-list .template-item textarea{font-family:var(--font-family-mono);line-height:1.5;min-block-size:80px;resize:vertical}.template-editor-modal .modal-content .template-list .template-item .remove-template{align-items:center;background:#0000;border:1px solid var(--color-outline-variant);border-radius:var(--radius-sm);color:var(--color-on-surface-variant);cursor:pointer;display:flex;flex-shrink:0;font-size:var(--text-sm);justify-content:center;min-block-size:28px;min-inline-size:28px;padding:var(--space-xs);transition:all var(--motion-fast,.14s)}.template-editor-modal .modal-content .template-list .template-item .remove-template:hover{background:color-mix(in oklab,var(--color-error) 12%,#0000);border-color:var(--color-error);color:var(--color-error)}.template-editor-modal .modal-content .modal-actions{align-items:center;border-top:1px solid var(--color-outline-variant);display:flex;flex-wrap:wrap;gap:var(--space-sm);padding-top:var(--space-lg)}.template-editor-modal .modal-content .modal-actions .btn{border-radius:var(--radius-md);cursor:pointer;font-size:var(--text-sm);font-weight:var(--font-weight-medium);padding:var(--space-sm) var(--space-lg);transition:all var(--motion-fast)}.template-editor-modal .modal-content .modal-actions .btn.primary{background:var(--color-primary);border:1px solid var(--color-primary);color:var(--color-on-primary)}.template-editor-modal .modal-content .modal-actions .btn.primary:hover{background:color-mix(in oklab,var(--color-primary) 90%,#000)}.template-editor-modal .modal-content .modal-actions .btn:not(.primary){background:var(--color-surface-container);border:1px solid var(--color-outline);color:var(--color-on-surface)}.template-editor-modal .modal-content .modal-actions .btn:not(.primary):hover{background:var(--color-surface-container-high)}.action-history-modal .history-stats{display:flex;gap:var(--space-md);margin-bottom:var(--space-lg)}@container (max-width: 768px){.action-history-modal .history-stats{flex-direction:column;gap:var(--space-sm)}}.action-history-modal .history-stats .stat-card{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);flex:1;padding:var(--space-md);text-align:center}.action-history-modal .history-stats .stat-card .stat-value{color:var(--color-on-surface);display:block;font-size:var(--text-2xl);font-weight:var(--font-weight-bold);margin-bottom:var(--space-xs)}.action-history-modal .history-stats .stat-card .stat-value.success{color:var(--color-success)}.action-history-modal .history-stats .stat-card .stat-value.error{color:var(--color-error)}.action-history-modal .history-stats .stat-card .stat-label{color:var(--color-on-surface-variant);font-size:var(--text-sm);font-weight:var(--font-weight-medium)}.action-history-modal .history-filters{display:flex;gap:var(--space-md);margin-bottom:var(--space-lg)}@container (max-width: 768px){.action-history-modal .history-filters{flex-direction:column;gap:var(--space-sm)}}.action-history-modal .history-filters .filter-select{background:var(--color-surface-container);border:1px solid var(--color-outline);border-radius:var(--radius-md);color:var(--color-on-surface);cursor:pointer;font-size:var(--text-sm);padding:var(--space-sm)}.action-history-modal .history-filters .filter-select:focus{border-color:var(--color-primary);outline:none}.action-history-modal .action-history-list{display:flex;flex:1;flex-direction:column;gap:var(--space-sm);overflow-y:auto}.action-history-modal .action-history-list .no-history{color:var(--color-on-surface-variant);font-style:italic;padding:var(--space-xl);text-align:center}.action-history-modal .action-history-list .action-history-item{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);padding:var(--space-md);transition:all var(--motion-fast)}.action-history-modal .action-history-list .action-history-item:hover{background:var(--color-surface-container-high);box-shadow:var(--elev-1)}.action-history-modal .action-history-list .action-history-item.completed{border-color:var(--color-success)}.action-history-modal .action-history-list .action-history-item.failed{border-color:var(--color-error)}.action-history-modal .action-history-list .action-history-item.processing{animation:pulse 2s infinite;border-color:var(--color-primary)}.action-history-modal .action-history-list .action-history-item .action-header{align-items:flex-start;display:flex;gap:var(--space-sm);justify-content:space-between;margin-bottom:var(--space-sm)}@container (max-width: 768px){.action-history-modal .action-history-list .action-history-item .action-header{align-items:stretch;flex-direction:column}}.action-history-modal .action-history-list .action-history-item .action-header .action-meta{display:flex;flex:1;flex-direction:column;gap:var(--space-xs)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status{align-items:center;display:inline-flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-xs)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status:before{border-radius:50%;content:\"\";height:8px;width:8px}.completed .action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status:before{background:var(--color-success)}.failed .action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status:before{background:var(--color-error)}.processing .action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-status:before{animation:blink 1s infinite;background:var(--color-primary)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-type{color:var(--color-on-surface);font-size:var(--text-sm);font-weight:var(--font-weight-semibold)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-time{color:var(--color-on-surface-variant);font-size:var(--text-xs)}.action-history-modal .action-history-list .action-history-item .action-header .action-meta .action-duration{color:var(--color-primary);font-size:var(--text-xs);font-weight:var(--font-weight-medium)}.action-history-modal .action-history-list .action-history-item .action-header .action-actions{display:flex;flex-shrink:0;gap:var(--space-xs)}.action-history-modal .action-history-list .action-history-item .action-header .action-actions .btn{font-size:var(--text-xs);padding:var(--space-xs) var(--space-sm)}.action-history-modal .action-history-list .action-history-item .action-content{display:flex;flex-direction:column;gap:var(--space-sm)}.action-history-modal .action-history-list .action-history-item .action-content .input-preview,.action-history-modal .action-history-list .action-history-item .action-content .result-preview{font-size:var(--text-sm)}.action-history-modal .action-history-list .action-history-item .action-content .input-preview strong,.action-history-modal .action-history-list .action-history-item .action-content .result-preview strong{color:var(--color-on-surface);font-weight:var(--font-weight-semibold)}.action-history-modal .action-history-list .action-history-item .action-content .input-preview .result-content,.action-history-modal .action-history-list .action-history-item .action-content .result-preview .result-content{background:var(--color-surface);border-radius:var(--radius-sm);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:var(--text-xs);margin-top:var(--space-xs);max-block-size:200px;overflow-y:auto;padding:var(--space-sm)}.action-history-modal .action-history-list .action-history-item .action-content .error-preview{background:color-mix(in oklab,var(--color-error) 10%,#0000);border:1px solid color-mix(in oklab,var(--color-error) 30%,#0000);border-radius:var(--radius-sm);color:var(--color-error);font-size:var(--text-sm);padding:var(--space-sm)}.action-history-modal .action-history-list .action-history-item .action-content .error-preview strong{color:var(--color-error)}.action-details-modal .details-grid{display:grid;gap:var(--space-md);grid-template-columns:1fr 1fr;margin-bottom:var(--space-lg)}@container (max-width: 768px){.action-details-modal .details-grid{gap:var(--space-sm);grid-template-columns:1fr}}.action-details-modal .details-grid .detail-item{display:flex;flex-direction:column;gap:var(--space-xs)}.action-details-modal .details-grid .detail-item label{color:var(--color-on-surface);font-size:var(--text-sm);font-weight:var(--font-weight-semibold)}.action-details-modal .details-grid .detail-item span{color:var(--color-on-surface-variant);font-family:var(--font-family-mono);font-size:var(--text-sm)}.action-details-modal .details-grid .detail-item span.status-completed{color:var(--color-success)}.action-details-modal .details-grid .detail-item span.status-failed{color:var(--color-error)}.action-details-modal .details-grid .detail-item span.status-processing{color:var(--color-primary)}.action-details-modal .details-section{margin-bottom:var(--space-lg)}.action-details-modal .details-section:last-child{margin-bottom:0}.action-details-modal .details-section h4{color:var(--color-on-surface);font-size:var(--text-base);font-weight:var(--font-weight-semibold);margin:0 0 var(--space-md) 0}.action-details-modal .details-section .input-details,.action-details-modal .details-section .result-details{color:var(--color-on-surface-variant);font-size:var(--text-sm);line-height:1.5}.action-details-modal .details-section .error-details{background:color-mix(in oklab,var(--color-error) 10%,#0000);border:1px solid color-mix(in oklab,var(--color-error) 30%,#0000);border-radius:var(--radius-md);color:var(--color-error);font-family:var(--font-family-mono);font-size:var(--text-sm);padding:var(--space-md)}.history-section .history-header{align-items:center;display:flex;justify-content:space-between;margin-bottom:var(--space-md)}.history-section .history-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0}.history-section .history-header .history-actions{align-items:center;display:flex;gap:var(--space-sm)}.history-section .recent-history{display:flex;flex-direction:column;gap:var(--space-sm);margin-bottom:var(--space-md)}.history-section .recent-history .no-history{color:var(--color-on-surface-variant);font-style:italic;padding:var(--space-lg);text-align:center}.history-section .recent-history .history-item-compact{align-items:center;background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);display:flex;justify-content:space-between;padding:var(--space-sm) var(--space-md);transition:all var(--motion-fast)}.history-section .recent-history .history-item-compact:hover{background:var(--color-surface-container-high)}.history-section .recent-history .history-item-compact .history-meta{align-items:center;display:flex;flex:1;gap:var(--space-sm)}.history-section .recent-history .history-item-compact .history-meta .history-status{color:var(--color-success);font-size:var(--text-sm);font-weight:var(--font-weight-medium)}.history-section .recent-history .history-item-compact .history-meta .history-prompt{color:var(--color-on-surface);flex:1;font-size:var(--text-sm)}.history-section .recent-history .history-item-compact .history-meta .history-time{color:var(--color-on-surface-variant);font-size:var(--text-xs);font-weight:var(--font-weight-medium)}.history-section .recent-history .history-item-compact .btn{font-size:var(--text-xs);padding:var(--space-xs) var(--space-sm)}.history-section .action-stats{display:grid;gap:var(--space-sm);grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}.history-section .action-stats .stats-item{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);padding:var(--space-sm);text-align:center}.history-section .action-stats .stats-item:first-child{background:var(--color-primary-container);border-color:var(--color-primary);color:var(--color-on-primary-container)}.data-pipeline-section{background:var(--color-surface-container);border:1px solid var(--color-outline-variant);border-radius:var(--radius-lg);margin-top:var(--space-lg);padding:var(--space-lg)}.data-pipeline-section .pipeline-header{align-items:center;display:flex;justify-content:space-between;margin-bottom:var(--space-lg)}.data-pipeline-section .pipeline-header h3{color:var(--color-on-surface);font-size:var(--text-lg);font-weight:var(--font-weight-semibold);margin:0}.data-pipeline-section .pipeline-header .pipeline-actions{align-items:center;display:flex;gap:var(--space-sm)}.data-pipeline-section .pipeline-steps{display:flex;flex-direction:column;gap:var(--space-md)}.data-pipeline-section .pipeline-steps .pipeline-step{background:var(--color-surface-container-low);border:1px solid var(--color-outline-variant);border-radius:var(--radius-md);padding:var(--space-md)}.data-pipeline-section .pipeline-steps .pipeline-step.recognized-step{background:var(--color-secondary-container);border-color:var(--color-secondary)}.data-pipeline-section .pipeline-steps .pipeline-step.processed-step{background:var(--color-tertiary-container);border-color:var(--color-tertiary)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header{align-items:center;display:flex;gap:var(--space-sm);margin-bottom:var(--space-sm)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header ui-icon{color:var(--color-on-surface-variant);flex-shrink:0}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .step-title{color:var(--color-on-surface);flex:1;font-size:var(--text-sm);font-weight:var(--font-weight-semibold)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .step-time{color:var(--color-on-surface-variant);font-size:var(--text-xs)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .step-source{color:var(--color-primary);font-size:var(--text-xs);font-weight:var(--font-weight-medium)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .step-format{color:var(--color-on-surface-variant);font-family:var(--font-family-mono);font-size:var(--text-xs)}.data-pipeline-section .pipeline-steps .pipeline-step .step-header .btn{font-size:var(--text-xs);padding:var(--space-xs) var(--space-sm)}.data-pipeline-section .pipeline-steps .pipeline-step .step-content .step-preview{color:var(--color-on-surface);font-size:var(--text-sm);line-height:1.5;max-block-size:100px;overflow:hidden;text-overflow:ellipsis}}";

const createCustomInstructionsPanel = (opts = {}) => {
  const state = observe({
    instructions: [],
    activeId: "",
    editingId: null,
    isAdding: false
  });
  const root = H`<div class="custom-instructions-panel">
        <div class="cip-select-row">
            <label class="field-label">Active instruction</label>
            <select class="field-control cip-select" data-action="select-active">
                <option value="">None (use default)</option>
            </select>
        </div>

        <div class="cip-list" data-list></div>

        <div class="cip-add-form" data-add-form hidden>
            <input type="text" class="field-control cip-input" data-field="label" placeholder="Instruction label..." />
            <textarea class="field-control cip-textarea" data-field="instruction" placeholder="Enter your custom instruction..." rows="4"></textarea>
            <div class="cip-form-actions">
                <button class="btn btn-primary btn-sm" type="button" data-action="save-new">Add</button>
                <button class="btn btn-sm" type="button" data-action="cancel-add">Cancel</button>
            </div>
        </div>

        <div class="cip-toolbar">
            <button class="btn btn-sm" type="button" data-action="add">
                <ui-icon icon="plus"></ui-icon>
                <span>Add Instruction</span>
            </button>
            <button class="btn btn-sm" type="button" data-action="add-templates">
                <ui-icon icon="file-text"></ui-icon>
                <span>Add Templates</span>
            </button>
        </div>
    </div>`;
  const listEl = root.querySelector("[data-list]");
  const selectEl = root.querySelector("[data-action='select-active']");
  const addFormEl = root.querySelector("[data-add-form]");
  const labelInput = root.querySelector("[data-field='label']");
  const instructionInput = root.querySelector("[data-field='instruction']");
  const renderList = () => {
    listEl.replaceChildren();
    if (!state.instructions.length) {
      listEl.append(H`<div class="cip-empty">No custom instructions defined.</div>`);
      return;
    }
    for (const instr of state.instructions) {
      const isEditing = state.editingId === instr.id;
      const isActive = state.activeId === instr.id;
      const item = H`<div class="cip-item ${isActive ? "is-active" : ""}" data-id="${instr.id}">
                <div class="cip-item-header">
                    <span class="cip-item-label">${instr.label}</span>
                    <div class="cip-item-actions">
                        ${isActive ? H`<span class="cip-badge">Active</span>` : H`<button class="btn btn-sm" type="button" data-action="activate">Use</button>`}
                        <button class="btn btn-sm" type="button" data-action="edit">
                            <ui-icon icon="pencil-simple"></ui-icon>
                        </button>
                        <button class="btn btn-sm btn-danger" type="button" data-action="delete">
                            <ui-icon icon="trash"></ui-icon>
                        </button>
                    </div>
                </div>
                ${isEditing ? H`<div class="cip-edit-form">
                        <input type="text" class="field-control" data-edit-field="label" value="${instr.label}" />
                        <textarea class="field-control" data-edit-field="instruction" rows="4">${instr.instruction}</textarea>
                        <div class="cip-form-actions">
                            <button class="btn btn-primary btn-sm" type="button" data-action="save-edit">Save</button>
                            <button class="btn btn-sm" type="button" data-action="cancel-edit">Cancel</button>
                        </div>
                    </div>` : H`<div class="cip-item-preview">${truncate(instr.instruction, 150)}</div>`}
            </div>`;
      item.addEventListener("click", (e) => {
        const target = e.target;
        const action = target.closest("[data-action]")?.getAttribute("data-action");
        if (action === "activate") {
          void setActiveInstruction(instr.id).then(() => {
            state.activeId = instr.id;
            renderList();
            updateSelect();
            showSuccess("Instruction activated");
            opts.onUpdate?.();
          }).catch((e2) => {
            console.error("[CustomInstructionsPanel] Failed to activate:", e2);
            showError("Failed to activate instruction");
          });
        }
        if (action === "edit") {
          state.editingId = instr.id;
          renderList();
        }
        if (action === "delete") {
          if (confirm(`Delete "${instr.label}"?`)) {
            void deleteInstruction(instr.id).then(() => {
              state.instructions = state.instructions.filter((i) => i.id !== instr.id);
              if (state.activeId === instr.id) state.activeId = "";
              renderList();
              updateSelect();
              showSuccess("Instruction deleted");
              opts.onUpdate?.();
            }).catch((e2) => {
              console.error("[CustomInstructionsPanel] Failed to delete:", e2);
              showError("Failed to delete instruction");
            });
          }
        }
        if (action === "save-edit") {
          const labelEl = item.querySelector("[data-edit-field='label']");
          const instrEl = item.querySelector("[data-edit-field='instruction']");
          void updateInstruction(instr.id, {
            label: labelEl.value.trim() || instr.label,
            instruction: instrEl.value.trim()
          }).then(() => {
            instr.label = labelEl.value.trim() || instr.label;
            instr.instruction = instrEl.value.trim();
            state.editingId = null;
            renderList();
            updateSelect();
            showSuccess("Instruction updated");
            opts.onUpdate?.();
          }).catch((e2) => {
            console.error("[CustomInstructionsPanel] Failed to update:", e2);
            showError("Failed to update instruction");
          });
        }
        if (action === "cancel-edit") {
          state.editingId = null;
          renderList();
        }
      });
      listEl.append(item);
    }
  };
  const updateSelect = () => {
    selectEl.replaceChildren();
    selectEl.append(H`<option value="">None (use default)</option>`);
    for (const instr of state.instructions) {
      const opt = H`<option value="${instr.id}">${instr.label}</option>`;
      if (instr.id === state.activeId) opt.selected = true;
      selectEl.append(opt);
    }
  };
  const truncate = (text, maxLen) => {
    if (!text || text.length <= maxLen) return text || "";
    return text.slice(0, maxLen).trim() + "…";
  };
  const loadData = async () => {
    const settings = await loadSettings();
    state.instructions = settings?.ai?.customInstructions || [];
    state.activeId = settings?.ai?.activeInstructionId || "";
    renderList();
    updateSelect();
  };
  root.addEventListener("click", (e) => {
    const target = e.target;
    const action = target.closest("[data-action]")?.getAttribute("data-action");
    if (action === "add") {
      state.isAdding = true;
      addFormEl.hidden = false;
      labelInput.value = "";
      instructionInput.value = "";
      labelInput.focus();
    }
    if (action === "cancel-add") {
      state.isAdding = false;
      addFormEl.hidden = true;
    }
    if (action === "save-new") {
      const label = labelInput.value.trim();
      const instruction = instructionInput.value.trim();
      if (!instruction) {
        instructionInput.focus();
        showError("Instruction text is required");
        return;
      }
      void addInstruction(label || "Custom", instruction).then((newInstr) => {
        state.instructions.push(newInstr);
        state.isAdding = false;
        addFormEl.hidden = true;
        renderList();
        updateSelect();
        showSuccess("Instruction added");
        opts.onUpdate?.();
      }).catch((e2) => {
        console.error("[CustomInstructionsPanel] Failed to add:", e2);
        showError("Failed to add instruction");
      });
    }
    if (action === "add-templates") {
      const existingLabels = new Set(state.instructions.map((i) => i.label));
      const templatesToAdd = DEFAULT_INSTRUCTION_TEMPLATES.filter((t) => !existingLabels.has(t.label));
      if (!templatesToAdd.length) {
        showError("All templates already added");
        return;
      }
      addInstructions(templatesToAdd.map((t) => ({
        label: t.label,
        instruction: t.instruction,
        enabled: t.enabled
      }))).then((newInstrs) => {
        state.instructions.push(...newInstrs);
        renderList();
        updateSelect();
        showSuccess(`Added ${newInstrs.length} templates`);
        opts.onUpdate?.();
      }).catch((e2) => {
        console.error("[CustomInstructionsPanel] Failed to add templates:", e2);
        showError("Failed to add templates");
      });
    }
  });
  selectEl.addEventListener("change", () => {
    const newActiveId = selectEl.value || "";
    void setActiveInstruction(newActiveId || null).then(() => {
      state.activeId = newActiveId;
      renderList();
      if (newActiveId) {
        showSuccess("Instruction activated");
      }
      opts.onUpdate?.();
    });
  });
  void loadData();
  return root;
};

const STORAGE_KEY = "rs-workcenter-state";
class WorkCenterView {
  id = "workcenter";
  name = "Work Center";
  icon = "lightning";
  options;
  shellContext;
  element = null;
  files = observe([]);
  prompt = ref("");
  results = observe([]);
  processing = ref(false);
  stateManager = createViewState(STORAGE_KEY);
  _sheet = null;
  lifecycle = {
    onMount: () => this.onMount(),
    onUnmount: () => this.onUnmount(),
    onShow: () => this.onShow(),
    onHide: () => this.onHide()
  };
  constructor(options = {}) {
    this.options = options;
    this.shellContext = options.shellContext;
    if (options.initialFiles) {
      this.files.push(...options.initialFiles);
    }
    if (options.initialPrompt) {
      this.prompt.value = options.initialPrompt;
    }
  }
  render(options) {
    if (options) {
      this.options = { ...this.options, ...options };
      this.shellContext = options.shellContext || this.shellContext;
    }
    this._sheet = loadAsAdopted(workcenterStyles);
    this.element = H`
            <div class="view-workcenter">
                <div class="view-workcenter__main">
                    <div class="view-workcenter__input-area">
                    
                        <div class="view-workcenter__results" data-results>
                            <div class="view-workcenter__results-header">
                                <h3>Results</h3>
                            </div>
                            <div class="view-workcenter__results-list" data-results-list>
                                <div class="view-workcenter__results-empty">
                                    <p>Results will appear here</p>
                                </div>
                            </div>
                        </div>
                        <div class="view-workcenter__prompt">
                            <textarea
                                class="view-workcenter__prompt-input"
                                placeholder="Enter your prompt or instructions..."
                                data-prompt-input
                            ></textarea>
                            <button
                                class="view-workcenter__process-btn"
                                data-action="process"
                                type="button"
                            >
                                <ui-icon icon="brain" icon-style="duotone"></ui-icon>
                                <span>Process</span>
                            </button>
                        </div>
                    </div>
                    <div class="view-workcenter__files" data-files-zone data-action="add-files">
                        <div class="view-workcenter__files-header">
                            <h3>Attachments</h3>
                            <span class="view-workcenter__file-count" data-file-count>0 files</span>
                        </div>
                        <div class="view-workcenter__files-list" data-files-list>
                            <div class="view-workcenter__files-empty">
                                <ui-icon icon="paperclip" icon-style="duotone" size="32"></ui-icon>
                                <p>Drop files here or click to attach</p>
                            </div>
                        </div>
                        <div class="view-workcenter__files-actions">
                            <button class="view-workcenter__btn" data-action="clear-files" type="button">
                                <ui-icon icon="trash" icon-style="duotone"></ui-icon>
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>
                    ${createCustomInstructionsPanel({ onUpdate: () => this.updateResultsList() })}
 
                </div>
            </div>
        `;
    this.setupEventHandlers();
    this.setupDragDrop();
    this.updateFilesList();
    this.updateResultsList();
    affected(this.files, () => {
      this.updateFilesList();
      this.options.onFilesChange?.(this.files);
    });
    affected(this.results, () => {
      this.updateResultsList();
    });
    return this.element;
  }
  getToolbar() {
    return null;
  }
  // ========================================================================
  // PUBLIC API
  // ========================================================================
  /**
   * Add files to the work center
   */
  addFiles(files) {
    this.files.push(...files);
  }
  /**
   * Set the prompt
   */
  setPrompt(prompt) {
    this.prompt.value = prompt;
    const input = this.element?.querySelector("[data-prompt-input]");
    if (input) input.value = prompt;
  }
  /**
   * Get current files
   */
  getFiles() {
    return [...this.files];
  }
  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================
  setupEventHandlers() {
    if (!this.element) return;
    this.element.addEventListener("click", async (e) => {
      const target = e.target;
      const button = target.closest("[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      switch (action) {
        case "add-files":
          this.handleAddFiles();
          break;
        case "clear-files":
          this.handleClearFiles();
          break;
        case "process":
          await this.handleProcess();
          break;
      }
    });
    const promptInput = this.element.querySelector("[data-prompt-input]");
    if (promptInput) {
      promptInput.addEventListener("input", () => {
        this.prompt.value = promptInput.value;
      });
    }
  }
  setupDragDrop() {
    const filesZone = this.element?.querySelector("[data-files-zone]");
    if (!filesZone) return;
    filesZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      filesZone.classList.add("dragover");
    });
    filesZone.addEventListener("dragleave", () => {
      filesZone.classList.remove("dragover");
    });
    filesZone.addEventListener("drop", (e) => {
      e.preventDefault();
      filesZone.classList.remove("dragover");
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        this.addFiles(files);
        this.showMessage(`Added ${files.length} file(s)`);
      }
    });
  }
  handleAddFiles() {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (files.length > 0) {
        this.addFiles(files);
        this.showMessage(`Added ${files.length} file(s)`);
      }
    };
    input.click();
  }
  handleClearFiles() {
    this.files.length = 0;
    this.showMessage("Files cleared");
  }
  async handleProcess() {
    if (this.processing.value) return;
    if (this.files.length === 0 && !this.prompt.value.trim()) {
      this.showMessage("Add files or enter a prompt");
      return;
    }
    this.processing.value = true;
    this.showMessage("Processing...");
    try {
      const { recognizeByInstructions } = await __vitePreload(async () => { const { recognizeByInstructions } = await import('./RecognizeData.js');return { recognizeByInstructions }},true              ?[]:void 0,import.meta.url);
      const input = [
        {
          role: "user",
          content: this.prompt.value || "Process the attached files"
        }
      ];
      const result = await recognizeByInstructions(input, "Process the content and provide a structured response.");
      const resultEntry = {
        id: crypto.randomUUID(),
        content: result?.data ? String(result.data) : "No result",
        timestamp: Date.now(),
        ok: Boolean(result?.ok)
      };
      this.results.push(resultEntry);
      this.options.onProcessComplete?.(resultEntry.content);
      this.showMessage("Processing complete");
    } catch (error) {
      console.error("[WorkCenter] Processing failed:", error);
      this.results.push({
        id: crypto.randomUUID(),
        content: `Error: ${String(error)}`,
        timestamp: Date.now(),
        ok: false
      });
      this.showMessage("Processing failed");
    } finally {
      this.processing.value = false;
    }
  }
  updateFilesList() {
    const list = this.element?.querySelector("[data-files-list]");
    const count = this.element?.querySelector("[data-file-count]");
    if (!list) return;
    if (count) {
      count.textContent = `${this.files.length} file(s)`;
    }
    if (this.files.length === 0) {
      list.innerHTML = `
                <div class="view-workcenter__files-empty">
                    <ui-icon icon="paperclip" icon-style="duotone" size="32"></ui-icon>
                    <p>Drop files here or click to attach</p>
                </div>
            `;
      return;
    }
    list.innerHTML = "";
    for (const file of this.files) {
      const item = H`
                <div class="view-workcenter__file-item">
                    <ui-icon icon="file" icon-style="duotone"></ui-icon>
                    <span class="view-workcenter__file-name">${file.name}</span>
                    <span class="view-workcenter__file-size">${this.formatSize(file.size)}</span>
                    <button class="view-workcenter__file-remove" data-remove="${file.name}" type="button">
                        <ui-icon icon="x" icon-style="bold" size="12"></ui-icon>
                    </button>
                </div>
            `;
      item.querySelector("[data-remove]")?.addEventListener("click", () => {
        const index = this.files.findIndex((f) => f.name === file.name);
        if (index >= 0) {
          this.files.splice(index, 1);
        }
      });
      list.appendChild(item);
    }
  }
  updateResultsList() {
    const list = this.element?.querySelector("[data-results-list]");
    if (!list) return;
    if (this.results.length === 0) {
      list.innerHTML = `
                <div class="view-workcenter__results-empty">
                    <p>Results will appear here</p>
                </div>
            `;
      return;
    }
    list.innerHTML = "";
    for (const result of [...this.results].reverse()) {
      const item = H`
                <div class="view-workcenter__result-item ${result.ok ? "" : "error"}">
                    <div class="view-workcenter__result-header">
                        <span class="view-workcenter__result-time">${new Date(result.timestamp).toLocaleTimeString()}</span>
                        <button class="view-workcenter__result-copy" data-copy="${result.id}" type="button">
                            <ui-icon icon="copy" icon-style="duotone" size="14"></ui-icon>
                        </button>
                    </div>
                    <div class="view-workcenter__result-content">${result.content}</div>
                </div>
            `;
      item.querySelector("[data-copy]")?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(result.content);
          this.showMessage("Copied to clipboard");
        } catch {
          this.showMessage("Failed to copy");
        }
      });
      list.appendChild(item);
    }
  }
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  showMessage(message) {
    this.shellContext?.showMessage(message);
  }
  // ========================================================================
  // LIFECYCLE
  // ========================================================================
  onMount() {
    console.log("[WorkCenter] Mounted");
    this._sheet ??= loadAsAdopted(workcenterStyles);
  }
  onUnmount() {
    console.log("[WorkCenter] Unmounting");
    removeAdopted(this._sheet);
  }
  onShow() {
    this._sheet ??= loadAsAdopted(workcenterStyles);
    console.log("[WorkCenter] Shown");
  }
  onHide() {
    console.log("[WorkCenter] Hidden");
  }
  // ========================================================================
  // MESSAGE HANDLING
  // ========================================================================
  canHandleMessage(messageType) {
    return [
      "content-attach",
      "content-process",
      "file-attach",
      "share-target-input",
      "content-share"
    ].includes(messageType);
  }
  async handleMessage(message) {
    const msg = message;
    if (msg.data?.file) {
      this.addFiles([msg.data.file]);
    }
    if (msg.data?.files) {
      this.addFiles(msg.data.files);
    }
    if (msg.data?.text || msg.data?.content || msg.data?.url) {
      const prompt = msg.data.text || msg.data.content || msg.data.url || "";
      if (prompt.trim()) {
        this.setPrompt(prompt);
      }
    }
  }
}
function createView(options) {
  return new WorkCenterView(options);
}
const createWorkCenterView = createView;

export { WorkCenterView, createView, createWorkCenterView, createView as default };
//# sourceMappingURL=index15.js.map
