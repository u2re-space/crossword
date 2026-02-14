import { getDefaultExportFromCjs } from './_commonjsHelpers.js';
import { provide, E as E$1, preloadStyle } from './Settings.js';
import './Env.js';
import { katex } from './katex.js';
import markedKatex from './index3.js';

const styles = "@import url(\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap\");@layer tokens, base, layout, utilities, shells, shell, views, view, viewer, components, markdown, essentials, overrides;@keyframes h{0%{transform:rotate(0deg)}to{transform:rotate(1turn)}}@keyframes l{0%{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@layer tokens{:host,:root,:scope{--print-font-family:var(--font-family-serif,\"Times New Roman\",\"Times\",\"Liberation Serif\",\"Noto Serif\",serif);--print-font-family-sans:var(--font-family-sans,\"Inter\",-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,sans-serif);--print-font-mono:var(--font-family-mono,\"Monaco\",\"Menlo\",\"Ubuntu Mono\",\"Liberation Mono\",\"Noto Mono\",monospace);--print-text-color:#1a1a1a;--print-bg:#fff;--print-border-color:#d1d5db;--print-link-color:#2563eb}@media (prefers-color-scheme:dark){:host,:root,:scope{--print-text-color:#f3f4f6;--print-bg:#111827;--print-border-color:#374151;--print-link-color:#60a5fa}}}@page{size:A4;margin:config(\"page\",\"margin\");@bottom-center{content:counter(page);font-family:config(\"typography\",\"font-family\",\"sans\");font-size:config(\"typography\",\"font-size\",\"base\");line-height:1.4}@top-right{content:\"UC\";font-family:config(\"typography\",\"font-family\",\"sans\");font-size:config(\"typography\",\"font-size\",\"base\")}}@page :first{margin-bottom:2.5cm;margin-left:2cm;margin-right:2cm;margin-top:2cm}@page :left{margin-left:2cm;margin-right:2cm}@page :right{margin-left:2cm;margin-right:2cm}@page narrow{size:A5 portrait;margin:1.5cm 1.5cm 1.5cm 1.5cm}@page wide{size:A4 landscape;margin:2cm 2cm 2cm 2cm}@page letter{size:letter portrait;margin:2.5cm 2cm 2.5cm 2cm}@page legal{size:legal portrait;margin:2.5cm 2cm 2.5cm 2cm}@page professional{size:A4 portrait;margin:2.5cm 2cm 2.5cm 2cm;marks:crop cross;bleed:.25cm}@page booklet{size:A5 portrait;margin:1.5cm 1.5cm 1.5cm 1.5cm;marks:none;bleed:0}@page draft{size:A4 portrait;margin:2cm 1.5cm 2cm 1.5cm;marks:none;bleed:0}@layer markdown{:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden]){--base-size-4:0.25em;--base-size-8:0.5em;--base-size-16:1em;--base-size-24:1.5em;--base-size-40:2.5em;--base-text-weight-normal:400;--base-text-weight-medium:500;--base-text-weight-semibold:600;--fontStack-monospace:ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;--color-primary:light-dark(#5a7fff,#7ca7ff);--color-success:light-dark(#10b981,#34d399);--color-warning:light-dark(#f59e0b,#fbbf24);--color-error:light-dark(#ef4444,#f87171);--color-info:light-dark(#60a5fa,#93c5fd);--color-surface:light-dark(#fafbfc,#0f1419);--color-surface-container:light-dark(#f1f5f9,#1e293b);--color-surface-container-low:light-dark(#f8fafc,#0f172a);--color-surface-container-lowest:light-dark(#fafbfc,#0f1419);--color-surface-container-high:light-dark(#e2e8f0,#334155);--color-surface-container-highest:light-dark(#cbd5e1,#475569);--color-on-surface:light-dark(#1e293b,#f1f5f9);--color-on-surface-variant:light-dark(#64748b,#94a3b8);--color-on-primary:light-dark(#fff,#fff);--color-on-secondary:light-dark(#fff,#fff);--color-outline:light-dark(#cbd5e1,#475569);--color-outline-variant:light-dark(#94a3b8,#64748b);--hover:light-dark(#f1f5f9,#334155);--active:light-dark(#e2e8f0,#1e293b);--focus:light-dark(#dbeafe,#1e40af);--elev-0:0 0 0 0 #0000;--elev-1:0 1px 2px 0 #00000024,0 1px 3px 0 #0000001f;--elev-2:0 2px 4px 0 #00000024,0 3px 6px 0 #0000001c;--elev-3:0 4px 6px 0 #00000024,0 6px 12px 0 #0000001c;--elev-4:0 6px 8px 0 #00000024,0 9px 18px 0 #0000001c;--motion-fast:140ms ease;--motion-normal:200ms ease;--motion-slow:300ms ease;--space-xs:0.25rem;--space-sm:0.5rem;--space-md:0.75rem;--space-lg:1rem;--space-xl:1.5rem;--space-2xl:2rem;--radius-xs:0.25rem;--radius-sm:0.375rem;--radius-md:0.5rem;--radius-lg:0.75rem;--radius-xl:1rem;--radius-full:9999px;--focus-outlineColor:var(--color-primary);--fgColor-default:var(--color-on-surface);--fgColor-muted:var(--color-on-surface-variant);--fgColor-accent:var(--color-accent);--fgColor-success:var(--color-success);--fgColor-attention:var(--color-warning);--fgColor-danger:var(--color-error);--fgColor-done:var(--color-info);--bgColor-default:var(--color-surface);--bgColor-muted:var(--color-surface-container);--bgColor-neutral-muted:var(--color-surface-container-high);--bgColor-attention-muted:var(--color-warning);--borderColor-default:var(--color-outline);--borderColor-muted:var(--color-outline-variant);--borderColor-neutral-muted:var(--color-outline);--borderColor-accent-emphasis:var(--color-primary);--borderColor-success-emphasis:var(--color-success);--borderColor-attention-emphasis:var(--color-warning);--borderColor-danger-emphasis:var(--color-error);--borderColor-done-emphasis:var(--color-info);--active-brightness:config(\"effects\",\"active-brightness\");--border-radius:config(\"shape\",\"border-radius\");--box-shadow:config(\"shape\",\"box-shadow\");--color-accent:light-dark(\"accent\");--color-bg:light-dark(\"bg\");--color-bg-secondary:light-dark(\"bg-secondary\");--color-link:light-dark(\"link\");--color-secondary:light-dark(\"secondary\");--color-secondary-accent:light-dark(\"secondary-accent\");--color-shadow:light-dark(\"shadow\");--color-table:light-dark(\"table\");--color-text:light-dark(\"text\");--color-text-secondary:light-dark(\"text-secondary\");--color-scrollbar:light-dark(\"scrollbar\");--font-family-emoji-flag-capable:config(\"typography\",\"font-family\",\"emoji\");--font-family:config(\"typography\",\"font-family\",\"sans\");--hover-brightness:config(\"effects\",\"hover-brightness\");--justify-important:config(\"layout\",\"justify-important\");--justify-normal:config(\"layout\",\"justify-normal\");--line-height:config(\"layout\",\"line-height\");--width-card:config(\"layout\",\"widths\",\"card\");--width-card-medium:config(\"layout\",\"widths\",\"card-medium\");--width-card-wide:config(\"layout\",\"widths\",\"card-wide\");--width-content:config(\"layout\",\"widths\",\"content\");--md-scrollbar-size:config(\"scrollbar\",\"size\")}:where(body):has(:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden])){--md-fg-default:light-dark(#1f2328,#e6edf3);--md-fg-muted:light-dark(#656d76,#7d8590);--md-fg-accent:light-dark(#0969da,#2f81f7);--md-bg-default:light-dark(#fff,#0d1117);--md-bg-subtle:light-dark(#f6f8fa,#161b22);--md-bg-code:light-dark(#eff1f3,#25292f);--md-border-default:light-dark(#d0d7de,#30363d);--md-border-subtle:light-dark(#eff1f3,#21262d);--md-font-body:\"Noto Serif\",\"Noto Serif Display\",\"PT Serif\",\"IBM Plex Serif\",\"Literata\",\"Merriweather\",\"Source Serif 4\",\"Georgia\",\"Cambria\",\"Palatino Linotype\",\"Times New Roman\",\"Times\",serif,-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Noto Sans\",Helvetica,Arial,sans-serif,var(--font-family-emoji-flag-capable);--md-font-mono:\"ui-monospace\",\"SFMono-Regular\",\"SF Mono\",\"Menlo\",\"Consolas\",\"Liberation Mono\",\"monospace\";--md-radius:8px;pointer-events:auto;touch-action:manipulation;user-select:text;font-smooth:always!important;-webkit-font-smoothing:subpixel-antialiased!important;-moz-osx-font-smoothing:auto!important;background-color:initial;color:var(--md-fg-default);margin:0;word-wrap:break-word;color-scheme:inherit;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;block-size:fit-content;contain:none;container-type:normal;display:block;inline-size:100%;max-block-size:none;min-block-size:100%;overflow:hidden;text-align:start}:where(html,body):has(:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden])){box-sizing:border-box}:where(html,body):has(:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden])),:where(html,body):has(:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden])) *{box-sizing:border-box}:where(html,body):has(:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden])){background-color:initial;block-size:100%;contain:none;container-type:inline-size;content-visibility:visible;display:block;flex-direction:column;inline-size:100%;margin:0;max-block-size:min(100dvb,100cqb);min-block-size:100%;overflow:auto;padding:0;pointer-events:auto;text-align:start;touch-action:manipulation;user-select:text}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref){background:var(--color-surface);block-size:stretch;box-shadow:var(--elev-1);color:var(--color-on-surface);display:flex;flex:1;flex-direction:column;font-family:var(--md-font-body,var(--font-family-system));font-weight:var(--font-weight-normal);line-height:var(--leading-relaxed);max-block-size:stretch;overflow:auto;overflow-wrap:break-word;padding:var(--space-2xl) var(--space-xl);position:relative;transition:all var(--motion-normal);word-wrap:break-word;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;color-scheme:inherit;contain:inline-size layout paint style;font-size:inherit;isolation:isolate;pointer-events:auto;scrollbar-color:var(--color-scrollbar) #0000;scrollbar-width:thin;text-align:start;touch-action:manipulation;user-select:text}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)::-webkit-scrollbar{block-size:10px;inline-size:10px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)::-webkit-scrollbar-thumb{background-color:var(--color-scrollbar);border-radius:8px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)::-webkit-scrollbar-track{background-color:initial}@container (max-width: 768px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref){border-radius:var(--radius-lg);box-shadow:none}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref):hover{box-shadow:var(--elev-2)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref):focus-within{box-shadow:var(--focus-ring),var(--elev-2);outline:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)::-webkit-scrollbar{height:8px;width:8px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)::-webkit-scrollbar-track{background:#0000}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)::-webkit-scrollbar-thumb{background:var(--color-outline-variant);border-radius:4px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)::-webkit-scrollbar-thumb:hover{background:var(--color-outline)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{color:var(--color-on-surface);font-weight:var(--font-weight-semibold);letter-spacing:-.025em;line-height:var(--leading-tight);margin:var(--space-2xl) 0 var(--space-lg)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6:first-child{margin-top:0}@container (max-width: 768px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{margin:var(--space-xl) 0 var(--space-md)}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1{font-size:var(--text-3xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2{font-size:var(--text-2xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3{font-size:var(--text-xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4{font-size:var(--text-lg)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5{font-size:var(--text-base)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{font-size:var(--text-sm)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p{color:var(--color-on-surface);margin:0 0 var(--space-lg)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p:last-child{margin-bottom:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a{color:var(--color-primary);text-decoration-thickness:1px;text-underline-offset:2px;transition:all var(--motion-fast)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a:hover{color:var(--color-primary);text-decoration-thickness:2px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a:focus-visible{border-radius:var(--radius-sm);box-shadow:var(--focus-ring);outline:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{color:var(--color-on-surface);margin:var(--space-lg) 0;padding-left:var(--space-2xl)}@container (max-width: 480px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{padding-left:var(--space-xl)}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol li,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul li{margin-bottom:var(--space-sm)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol li:last-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul li:last-child{margin-bottom:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{background:var(--color-surface-container-low);border-left:4px solid var(--color-primary);border-radius:0 var(--radius-lg) var(--radius-lg) 0;color:var(--color-on-surface);margin:var(--space-xl) 0;padding:var(--space-lg) var(--space-xl);position:relative}@container (max-width: 768px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{margin:var(--space-lg) 0;padding:var(--space-md) var(--space-lg)}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote:before{color:var(--color-primary);content:'\"';font-size:var(--text-2xl);left:var(--space-sm);opacity:.3;position:absolute;top:var(--space-sm)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background:var(--color-surface-container-high);border:none;border-radius:var(--radius-lg);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:var(--text-sm);line-height:var(--leading-normal);margin:var(--space-xl) 0;padding:var(--space-lg);scrollbar-color:var(--color-outline) #0000;scrollbar-width:thin}@container (max-width: 768px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{margin:var(--space-lg) 0;padding:var(--space-md)}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre::-webkit-scrollbar{height:6px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre::-webkit-scrollbar-thumb{background:var(--color-outline);border-radius:3px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre code{color:inherit;font-family:inherit;font-size:inherit}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code:not(pre code){background:var(--color-surface-container-high);border:none;border-radius:var(--radius-sm);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:.875em;font-weight:var(--font-weight-medium);padding:.125rem .375rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{block-size:max-content;border:.5px solid color-mix(in oklab,var(--print-border-color) 30%,#0000);border-radius:var(--radius-lg);font-size:var(--text-sm);margin:var(--space-xl) 0;max-block-size:max-content;overflow:hidden}@container (max-width: 768px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{font-size:var(--text-xs);margin:var(--space-lg) 0}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tbody,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tfoot,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table thead,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tr{block-size:max-content;inline-size:stretch;max-block-size:max-content;max-inline-size:stretch}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{block-size:max-content;border-bottom:.5px solid color-mix(in oklab,var(--print-border-color) 30%,#0000);color:var(--color-on-surface);max-block-size:max-content;padding:var(--space-md) var(--space-lg);text-align:left}@container (max-width: 768px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{padding:var(--space-sm) var(--space-md)}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{background:var(--color-surface-container-high);color:var(--color-on-surface);font-weight:var(--font-weight-semibold)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tbody tr:hover{background:var(--color-surface-container-low)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tbody tr:last-child td{border-bottom:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{border-top:.5px solid color-mix(in oklab,var(--print-border-color) 30%,#0000);margin:var(--space-2xl) 0;position:relative}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr:before{background:var(--color-primary);height:1px;left:50%;position:absolute;top:-1px;transform:translateX(-50%);width:60px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{border-radius:var(--radius-md);box-shadow:var(--elev-1);margin:var(--space-lg) 0}@container (max-width: 768px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{margin:var(--space-md) 0}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) input[type=checkbox]{accent-color:var(--color-primary);margin-right:var(--space-sm)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .katex{color:var(--color-on-surface);font-size:1.1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .footnote-ref a{color:var(--color-primary);font-size:.8em;vertical-align:super}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) dl{margin:var(--space-lg) 0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) dl dt{color:var(--color-on-surface);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-xs)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) dl dd{color:var(--color-on-surface-variant);margin:0 0 var(--space-md) var(--space-xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) math{math-style:compact;math-shift:compact;inline-size:fit-content;math-depth:auto-add;max-inline-size:stretch}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{color:var(--md-fg-default);font-weight:600;line-height:1.25;margin-block-end:1rem;margin-block-start:1.5em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6:first-child{margin-block-start:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1 code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1 tt,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2 code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2 tt,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3 code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3 tt,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4 code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4 tt,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5 code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5 tt,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6 code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6 tt{font-family:var(--md-font-mono);font-size:inherit}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1{border-block-end:1px solid var(--md-border-subtle);font-size:2em;padding-block-end:.3em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2{border-block-end:1px solid var(--md-border-subtle);font-size:1.5em;padding-block-end:.3em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3{font-size:1.25em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4{font-size:1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5{font-size:.875em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{color:var(--md-fg-muted);font-size:.85em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p{margin-block-end:1rem;margin-block-start:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{border-inline-start:.25em solid var(--md-border-default);color:var(--md-fg-muted);margin:0 0 1rem;padding:0 1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote>:first-child{margin-block-start:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote>:last-child{margin-block-end:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a{background-color:initial;color:var(--md-fg-accent);text-decoration:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a:hover{text-decoration:underline}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a:not([href]){color:inherit;text-decoration:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{margin-block-end:1rem;margin-block-start:0;padding-inline-start:2em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol ul,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul ul{margin-block-end:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li{word-wrap:break-all}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li>p{margin-block-start:1rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li+li{margin-block-start:.25em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol{list-style-type:decimal}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol[type=a]{list-style-type:lower-alpha}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol[type=A]{list-style-type:upper-alpha}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol[type=i]{list-style-type:lower-roman}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol[type=I]{list-style-type:upper-roman}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol[type=\"1\"]{list-style-type:decimal}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{list-style-type:disc}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul ul{list-style-type:circle}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul ul ul{list-style-type:square}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) dl{padding:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) dl dt{font-size:1em;font-style:italic;font-weight:600;margin-block-start:1rem;padding:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) dl dd{margin-block-end:1rem;margin-inline-start:0;padding:0 1rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{border-spacing:0;inline-size:fit-content;margin-block-end:1rem;min-inline-size:0;overflow:auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tbody,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table thead{inline-size:fit-content;max-inline-size:stretch}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{border:1px solid var(--md-border-default);inline-size:fit-content;max-inline-size:stretch;padding:6px 13px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{background-color:var(--md-bg-subtle);font-weight:600}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tr{background-color:var(--md-bg-default);border-block-start:1px solid var(--md-border-subtle)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tr:nth-child(2n){background-color:var(--md-bg-subtle)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table img{background-color:initial}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) kbd,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) samp,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) tt{font-family:var(--md-font-mono);font-size:1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) samp,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) tt{background-color:var(--md-bg-code);border-radius:6px;font-size:85%;margin:0;padding:.2em .4em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background-color:var(--md-bg-code);border-radius:6px;font-size:85%;line-height:1.45;margin-block:0 1rem;overflow:auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre tt{display:inline;line-height:inherit;margin:0;overflow:visible;padding:0;word-wrap:normal;background-color:initial;border:0;font-size:100%;white-space:pre}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) span{inline-size:fit-content;max-inline-size:stretch}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) svg{contain:strict;width:fit-content!important;inline-size:fit-content!important;max-inline-size:stretch!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .footnotes{border-block-start:1px solid var(--md-border-default);color:var(--md-fg-muted);font-size:.75em;margin-block-start:2rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .footnotes ol{padding-inline-start:1.5em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .footnotes li{position:relative}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .footnotes li:target{color:var(--md-fg-default)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .footnotes li:target:before{border:2px solid var(--md-fg-accent);border-radius:6px;content:\"\";inset:-8px -8px -8px -24px;pointer-events:none;position:absolute}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .markdown-alert{border-inline-start:.25em solid var(--md-border-default);color:inherit;margin-block-end:1rem;padding:.5rem 1rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .markdown-alert.markdown-alert-note{border-color:var(--md-fg-accent)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .markdown-alert.markdown-alert-important{border-color:#8250df}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .markdown-alert.markdown-alert-warning{border-color:#bf8700}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .markdown-alert.markdown-alert-tip{border-color:#1a7f37}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .markdown-alert.markdown-alert-caution{border-color:#d1242f}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .markdown-alert .markdown-alert-title{align-items:center;display:flex;font-weight:600;line-height:1;margin-block-end:.5rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .markdown-alert .markdown-alert-title .octicon{margin-inline-end:.5rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .octicon{display:inline-block;fill:currentColor;vertical-align:text-bottom}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) g-emoji{display:inline-block;font-family:Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;font-size:1em;font-style:normal;font-weight:400;line-height:1;min-inline-size:1ch;vertical-align:-.075em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) g-emoji img{block-size:1em;inline-size:1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .anchor{float:inline-start;line-height:1;margin-inline-start:-20px;padding-inline-end:4px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .anchor:focus{outline:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .octicon-link{color:var(--md-fg-muted);opacity:.5;visibility:hidden}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .octicon-link:hover{opacity:1}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1:hover .anchor .octicon-link,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2:hover .anchor .octicon-link,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3:hover .anchor .octicon-link,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4:hover .anchor .octicon-link,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5:hover .anchor .octicon-link,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6:hover .anchor .octicon-link{visibility:visible}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{background-color:var(--md-border-default);block-size:.25em;border:0;box-sizing:initial;margin:24px 0;overflow:hidden;padding:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr:before{content:\"\";display:table}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr:after{clear:both;content:\"\";display:table}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{background-color:initial;border-style:none;box-sizing:initial}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img[align=right]{padding-inline-start:20px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img[align=left]{padding-inline-end:20px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) kbd{background-color:var(--md-bg-subtle);border:1px solid var(--md-border-default);border-radius:6px;box-shadow:inset 0 -1px 0 var(--md-border-default);color:var(--md-fg-default);display:inline-block;font-size:11px;line-height:10px;padding:3px 5px;vertical-align:middle}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) details{display:block}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) details summary{cursor:pointer;display:list-item}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) details summary h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) details summary h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) details summary h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) details summary h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) details summary h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) details summary h6{border-block-end:0;display:inline-block;margin:0;padding-block-end:0;vertical-align:middle}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .task-list-item{list-style-type:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .task-list-item input[type=checkbox]{margin:0 .2em .25em -1.6em;vertical-align:middle}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .pl-c{color:#6e7781}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .pl-c1{color:#0550ae}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .pl-k{color:#cf222e}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .pl-s{color:#0a3069}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .pl-v{color:#953800}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .pl-en{color:#8250df}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{line-height:1.2;margin-bottom:.5em;margin-top:1.5em;page-break-after:avoid;break-after:avoid}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1{border-bottom:.5px solid color-mix(in oklab,var(--print-border-color) 30%,#0000);font-size:2rem;padding-bottom:.5rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2{border-bottom:.5px solid color-mix(in oklab,var(--print-border-color) 30%,#0000);font-size:1.5rem;padding-bottom:.25rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3{font-size:1.25rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4{font-size:1.125rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5{font-size:1rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{font-size:.875rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{hyphens:auto;margin-bottom:1rem;orphans:3;text-align:justify;widows:3}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{padding-left:1.5rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li{margin-bottom:.25rem;word-wrap:break-word;overflow-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code{background:#f3f4f6;border-radius:.25rem;font-family:var(--print-font-mono);font-size:.875em;padding:.125rem .25rem;word-wrap:break-word;max-inline-size:100%;overflow-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background:#f3f4f6;border-radius:.5rem;box-sizing:border-box;inline-size:100%;margin:1rem 0;overflow-x:auto;padding:1rem;page-break-inside:avoid;word-wrap:break-word;overflow-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre code{background:none;border-radius:0;padding:0;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{border-left:4px solid var(--print-border-color);color:#6b7280;font-style:italic;margin:1rem 0;padding-left:1rem;word-wrap:break-word;overflow-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{border-collapse:collapse;box-sizing:border-box;display:table;inline-size:stretch;margin:1rem 0;max-inline-size:stretch;page-break-inside:avoid;table-layout:fixed;word-wrap:break-word;contain:inline-size layout paint style;container-type:inline-size;overflow-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) th{border:1px solid var(--print-border-color);padding:.5rem;text-align:left;vertical-align:top;word-wrap:break-word;overflow-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) th{background:#f9fafb;font-weight:600}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{border:none;border-top:1px solid var(--print-border-color);box-sizing:border-box;inline-size:100%;margin:2rem 0;page-break-after:avoid}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{height:auto;max-width:100%;max-inline-size:100%;page-break-inside:avoid;display:block}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a{color:var(--print-link-color);text-decoration:underline;word-wrap:break-word;max-inline-size:100%;overflow-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) b,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) strong{font-weight:600}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) em,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) i{font-style:italic}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) article,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) aside,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) div,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) footer,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) header,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) main,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) nav,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) section{box-sizing:border-box;inline-size:100%}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) *{box-sizing:border-box;inline-size:100%;max-inline-size:100%}.print-view{block-size:100vh;inline-size:100vw;margin:0;max-width:none;min-height:100vh;overflow-x:hidden;padding:0}.print-content{box-sizing:border-box;font-size:14px;hyphens:auto;inline-size:100%;line-height:1.6;margin:0;min-height:100vh;padding:2rem;text-align:justify;word-wrap:break-word;overflow-wrap:break-word}.markdown-viewer-content{animation:l .3s ease-out}.markdown-viewer-raw{background:var(--color-surface);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:var(--text-sm);line-height:var(--leading-normal);margin:0;overflow:auto;padding:var(--space-xl);tab-size:2;white-space:pre}.viewer-header{align-items:center;background:var(--color-surface-container-high);display:flex;flex-shrink:0;gap:var(--space-lg);justify-content:space-between;padding:var(--space-lg) var(--space-xl)}@container (max-width: 768px){.viewer-header{gap:var(--space-md);padding:var(--space-md) var(--space-lg)}}@container (max-width: 480px){.viewer-header{align-items:stretch;flex-direction:column;gap:var(--space-sm)}}.viewer-header h3{color:var(--color-on-surface);font-size:var(--text-xl);font-weight:var(--font-weight-semibold);letter-spacing:-.025em;line-height:var(--leading-tight);margin:0}@container (max-width: 768px){.viewer-header h3{font-size:var(--text-lg)}}.viewer-header .viewer-actions{align-items:center;display:flex;flex-wrap:wrap;gap:var(--space-sm)}@container (max-width: 640px){.viewer-header .viewer-actions{gap:var(--space-xs)}}@container (max-width: 480px){.viewer-header .viewer-actions{gap:var(--space-sm);justify-content:center}}@container (max-width: 360px){.viewer-header .viewer-actions{flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding-bottom:var(--space-xs);scrollbar-width:none;-webkit-overflow-scrolling:touch}.viewer-header .viewer-actions::-webkit-scrollbar{display:none}}.viewer-actions .viewer-btn{align-items:center;background:var(--color-surface-container);border:none;border-radius:var(--radius-lg);color:var(--color-on-surface);cursor:pointer;display:inline-flex;font-size:var(--text-sm);font-weight:var(--font-weight-medium);gap:var(--space-xs);min-block-size:44px;padding:var(--space-sm) var(--space-lg);position:relative;transition:all var(--motion-fast);white-space:nowrap}@container (max-width: 640px){.viewer-actions .viewer-btn{font-size:var(--text-xs);min-block-size:40px;padding:var(--space-xs) var(--space-md)}}@container (max-width: 480px){.viewer-actions .viewer-btn{min-block-size:44px;padding:var(--space-sm) var(--space-md)}}.viewer-actions .viewer-btn:hover{background:var(--color-surface-container-highest);box-shadow:var(--elev-1);transform:translateY(-1px)}.viewer-actions .viewer-btn:active{box-shadow:none;transform:translateY(0)}.viewer-actions .viewer-btn:focus-visible{box-shadow:var(--focus-ring);outline:none}.viewer-actions .viewer-btn.btn-icon{padding:var(--space-sm)}@container (max-width: 640px){.viewer-actions .viewer-btn.btn-icon{padding:var(--space-xs)}}.viewer-actions .viewer-btn.btn-icon ui-icon{flex-shrink:0;transition:color var(--motion-fast)}@container (max-width: 640px){.viewer-actions .viewer-btn.btn-icon .btn-text{display:none}}.viewer-actions .viewer-btn.btn-icon:hover ui-icon{color:var(--color-primary)}.viewer-actions .viewer-btn.loading{opacity:.7;pointer-events:none}.viewer-actions .viewer-btn.loading:after{animation:h 1s linear infinite;border:2px solid #0000;border-radius:50%;border-top-color:initial;content:\"\";height:16px;margin-left:var(--space-xs);width:16px}@container (max-width: 1024px){.viewer-actions .viewer-btn{padding:var(--space-xl) var(--space-lg)}}@container (max-width: 768px){.viewer-actions .viewer-btn{padding:var(--space-lg) var(--space-md)}}@container (max-width: 480px){.viewer-actions .viewer-btn{padding:var(--space-md) var(--space-sm)}}.viewer-actions .viewer-btn::selection{background:color-mix(in oklab,var(--color-primary) 20%,#0000);color:var(--color-on-primary)}@media (prefers-color-scheme:dark){.pl-c{color:#8b949e}.pl-c1{color:#79c0ff}.pl-k{color:#ff7b72}.pl-s{color:#a5d6ff}.pl-v{color:#ffa657}.pl-en{color:#d2a8ff}}@media screen{:where(html,body):has(:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden])){block-size:100vh;inline-size:100vw;margin:0;overflow:auto;padding:0}.print-view{min-block-size:100vh;padding:0}.print-content,.print-view{box-sizing:border-box;inline-size:100%;margin:0}.print-content{line-height:1.7;max-inline-size:none;padding:2rem;text-rendering:optimizeLegibility}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref){box-sizing:border-box;font-family:var(--print-font-family-sans);inline-size:100%}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{font-weight:600;line-height:1.25;margin-block-start:1.5em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6:first-child{margin-block-start:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1{font-size:2rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2{border-block-end:1px solid var(--view-border);font-size:1.5rem;padding-block-end:.3em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3{font-size:1.25rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4{font-size:1rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p{line-height:1.6;margin-block:1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{margin-block:1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol>li,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul>li{margin-block:.25em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code{background-color:light-dark(#0000000d,#ffffff14);border-radius:4px;font-family:SF Mono,Fira Code,JetBrains Mono,monospace;font-size:.875em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background-color:light-dark(#00000008,#ffffff0d);border-radius:8px;margin-block:1em;padding:1rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre code{background:none;padding:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{border-inline-start:4px solid #007acc66;color:var(--view-fg);margin-block:1em;margin-inline:0;opacity:.8;padding-inline-start:1rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{inline-size:stretch;margin-block:1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{border:1px solid var(--view-border);padding:.5rem .75rem;text-align:start}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{background-color:light-dark(#00000008,#ffffff0d);font-weight:600}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tr:nth-child(2n){background-color:light-dark(#00000005,#ffffff05)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a{color:var(--view-link-color)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a:hover{color:var(--view-link-hover)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{border-radius:8px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{border-block-start:1px solid var(--view-border);margin-block:2em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{break-after:avoid;break-inside:avoid;line-height:1.2;margin-block-end:.5em;margin-block-start:1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1{font-size:2.5em;margin-block-start:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2{font-size:2em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3{font-size:1.6em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p{hyphens:auto;line-height:1.7;margin-block-end:1.2em;text-align:justify}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{margin-block-end:1.2em;padding-inline-start:2em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li{line-height:1.6;margin-block-end:.5em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{background:#f8f9fa;border-inline-start:4px solid #007acc;break-inside:avoid;font-family:var(--print-font-family-sans);font-style:italic;margin-block:1.5em;padding:1em 1.5em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background:#f6f8fa;border-radius:6px;break-inside:avoid;line-height:1.4;margin-block:1.5em;overflow-x:auto;padding:1.2em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code{background:#f1f3f4;border-radius:3px;font-family:var(--print-font-mono);font-size:.9em;padding:.2em .4em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre code{font-family:var(--print-font-mono)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{block-size:max-content;border-collapse:collapse;box-sizing:border-box;break-inside:avoid;contain:inline-size layout paint style;container-type:inline-size;display:table;inline-size:100%;margin:1.5em 0;max-block-size:max-content;max-inline-size:stretch;overflow:hidden;table-layout:auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) th{border:1px solid #ddd;padding:.75em;text-align:start}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) th{background-color:#f8f9fa;font-weight:600}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{block-size:auto;break-inside:avoid;display:block;inline-size:auto;margin-block:1.5em;margin-inline:auto;max-inline-size:100%}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a{color:#007acc;text-decoration:none;transition:color .2s ease}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a:hover{color:#0056b3;text-decoration:underline}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{border:none;border-block-start:1px solid #eee;break-after:avoid;break-before:avoid;margin-block:2.5em;margin-inline:auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)>:first-child{margin-block-start:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)>:last-child{margin-block-end:0}}@media print{:where(:root,html){contain:inline-size layout paint style;container-type:inline-size}:where(body,html,:root){background-color:initial!important;border:none;color:initial;font-family:var(--print-font-family);font-variant-emoji:text;margin:0;padding:0}:where(html,body):has(:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden])){box-sizing:border-box;color:#000;font-family:var(--print-font-family);font-size:12pt;font-variant-emoji:text;inline-size:100%;line-height:1.4;print-color-adjust:exact;scrollbar-width:none;-ms-overflow-style:none;background:#fff;border:none;box-shadow:none;margin:0;padding:0}:where(html,body):has(:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not([hidden]))::-webkit-scrollbar{display:none}body{background-color:initial!important;block-size:max-content!important;contain:inline-size layout paint style;container-type:inline-size;max-block-size:max-content!important;overflow:visible!important;scrollbar-width:none;-ms-overflow-style:none;box-sizing:border-box;inline-size:100%;text-align:center}}@media print and (orientation:landscape){body{max-inline-size:297cm!important;scale:calc(100cqi / 297cm)!important}}@media print and (orientation:portrait){body{max-inline-size:210cm!important;scale:calc(100cqi / 210cm)!important}}@media print{:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref){background:var(--color-surface-container-low);block-size:max-content!important;color:var(--color-on-surface);contain:inline-size layout paint style;container-type:inline-size;font-family:var(--print-font-family);font-variant-emoji:text;line-height:var(--leading-relaxed);max-block-size:max-content!important;overflow:visible!important;scrollbar-width:none;-ms-overflow-style:none;border:none;margin:0;padding:0;--md-fg-default:#e6edf3;--md-fg-muted:#7d8590;--md-fg-accent:#2f81f7;--md-bg-default:#0d1117;--md-bg-subtle:#161b22;--md-bg-code:#25292f;--md-border-default:#30363d;--md-border-subtle:#21262d;--md-font-body:\"Noto Serif\",\"Noto Serif Display\",\"PT Serif\",\"IBM Plex Serif\",\"Literata\",\"Merriweather\",\"Source Serif 4\",\"Georgia\",\"Cambria\",\"Palatino Linotype\",\"Times New Roman\",\"Times\",serif,-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Noto Sans\",Helvetica,Arial,sans-serif,var(--font-family-emoji-flag-capable);--md-font-mono:\"ui-monospace\",\"SFMono-Regular\",\"SF Mono\",\"Menlo\",\"Consolas\",\"Liberation Mono\",\"monospace\";--md-radius:8px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) *{background-color:initial!important;border-color:#0000;box-shadow:none!important;font-variant-emoji:text}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) :heading,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) :where(h1,h2,h3,h4,h5,h6),:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) span{font-family:var(--print-font-family);font-variant-emoji:text}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background:#1f2937;color:#f3f4f6}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) th{background:#374151}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3{color:var(--color-on-surface)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .btn,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .viewer-btn{background:var(--color-surface-container-low);border-color:var(--color-outline);color:var(--color-on-surface);display:none!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .btn:hover,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .viewer-btn:hover{background:var(--color-surface-container);border-color:var(--color-primary)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{color:var(--color-on-surface);font-weight:var(--font-weight-bold);line-height:var(--leading-tight);margin:var(--space-lg) 0 var(--space-md) 0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5:first-child,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6:first-child{margin-top:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1{font-size:var(--text-3xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2{font-size:var(--text-2xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3{font-size:var(--text-xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4{font-size:var(--text-lg)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5{font-size:var(--text-base)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{font-size:var(--text-sm)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p{margin:var(--space-md) 0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p:first-child{margin-top:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p:last-child{margin-bottom:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{margin:var(--space-md) 0;padding-inline-start:var(--space-xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol li,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul li{line-height:var(--leading-relaxed);margin:var(--space-xs) 0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol li p,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul li p{margin:var(--space-xs) 0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a{color:var(--color-primary);text-underline-offset:.1em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a:hover{color:color-mix(in oklab,var(--color-primary) 85%,#000);text-decoration-thickness:2px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a:focus-visible{border-radius:var(--radius-sm);outline:2px solid var(--color-primary);outline-offset:2px}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background:var(--color-surface-container);border:none;border-radius:var(--radius-md);color:var(--color-on-surface);font-family:var(--font-family-mono);font-size:var(--text-sm);line-height:var(--leading-normal);margin:var(--space-lg) 0;padding:var(--space-lg)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre code{background:#0000;border:none;color:inherit;font-size:inherit;padding:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code{background:var(--color-surface-container-high);border:none;border-radius:var(--radius-sm);color:var(--color-on-surface-variant);font-family:var(--font-family-mono);font-size:.9em;font-weight:var(--font-weight-medium);padding:.125rem .25rem}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{background:color-mix(in oklab,var(--color-primary) 5%,var(--color-surface-container));border-inline-start:4px solid var(--color-primary);border-radius:0 var(--radius-md) var(--radius-md) 0;color:var(--color-on-surface-variant);font-style:italic;margin:var(--space-lg) 0;padding:var(--space-md) var(--space-lg)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote p{margin:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{background:var(--color-surface-container);border-collapse:collapse;border-radius:var(--radius-md);margin:var(--space-lg) 0;overflow:hidden}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{border-bottom:.5px solid color-mix(in oklab,var(--print-border-color) 30%,#0000);padding:var(--space-sm) var(--space-md);text-align:start}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{background:var(--color-surface-container-high);color:var(--color-on-surface);font-weight:var(--font-weight-semibold)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tbody tr:last-child td{border-bottom:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table tbody tr:hover{background:color-mix(in oklab,var(--color-surface-container) 95%,var(--color-primary) 5%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{border-top:.5px solid color-mix(in oklab,var(--print-border-color) 30%,#0000);margin:var(--space-xl) 0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) b,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) strong{color:var(--color-on-surface);font-weight:var(--font-weight-bold)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) em,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) i{color:var(--color-on-surface-variant);font-style:italic}@container (max-width: 768px){:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1{font-size:var(--text-2xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2{font-size:var(--text-xl)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3{font-size:var(--text-lg)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{font-size:var(--text-xs);padding:var(--space-md)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code{font-size:.85em}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .viewer-header{display:none}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{color:#000}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p{color:#000;orphans:3;widows:3}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{background:#f9f9f9;border-left-color:#666;color:#000}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background:#f5f5f5;border:1px solid #ccc;color:#000}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code:not(pre code){background:#f0f0f0;border:1px solid #ddd;color:#000}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{border:1px solid #666;border-radius:.5rem;contain:inline-size layout paint style;container-type:inline-size;display:table;inline-size:stretch;max-inline-size:stretch}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{border:1px solid #666;color:#000}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table th{background:#f0f0f0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{border-color:#666}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{max-width:100%}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a{color:#000;text-decoration:underline}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .katex{color:#000}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)[data-raw] .viewer-content{background:var(--color-surface)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-content,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-view{box-sizing:border-box;inline-size:100%;margin:0;padding:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) *,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) :after,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) :before{box-sizing:border-box;inline-size:100%;max-inline-size:100%}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre code{font-family:var(--print-font-mono)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{table-layout:fixed;width:100%!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{height:auto!important;max-width:100%!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{overflow-x:auto;white-space:pre-wrap;word-wrap:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{color:#000!important;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p{color:#000!important;filter:grayscale(100%);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a{color:#333!important;filter:grayscale(100%);text-decoration:underline!important;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{background:#f5f5f5!important;color:#333!important;filter:grayscale(100%);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{border-color:#666!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) td,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) th{border-color:#999!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) th{background:#e5e5e5!important;color:#333!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{background:#fafafa!important;border-left-color:#666!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{border-color:#999!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{filter:grayscale(100%);image-rendering:optimize-contrast}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) *,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) :after,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) :before{color:inherit!important;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-variant-emoji:text!important;text-shadow:none!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) b,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) strong{color:#000!important;filter:none;font-weight:700!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) em,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) i{color:#000!important;filter:none;font-style:italic!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{list-style-position:outside}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li::marker{color:#666!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre[class*=language-]{background:#f8f8f8!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre[class*=language-] *{filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .katex{color:#000!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) svg{filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) svg *{fill:currentColor!important;stroke:currentColor!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) input,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) select,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) textarea{background:#fff!important;border:1px solid #999!important;color:#000!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .highlight,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .mark{background:#e6e6e6!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .footnote,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .reference{background:#0000!important;border-top:1px solid #ccc!important;filter:grayscale(100%)}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a[href]:after{content:none!important}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h3,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h4,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h5,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h6{page-break-after:avoid;break-after:avoid;page-break-before:avoid;break-before:avoid;margin-bottom:.8em;margin-top:1.5em;orphans:2;widows:2}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h1:not(:first-of-type){page-break-before:always;break-before:page;margin-bottom:1.2em;margin-top:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) h2:not(:first-of-type){page-break-before:avoid;break-before:avoid;margin-bottom:1em;margin-top:1.8em}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) p{hyphens:auto;margin-bottom:1em;orphans:3;text-align:justify;widows:3;page-break-inside:auto;break-inside:auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ol,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) ul{margin-bottom:1em;orphans:2;widows:2;page-break-inside:auto;break-inside:auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) li{margin-bottom:.3em;orphans:1;widows:1;page-break-inside:avoid;break-inside:avoid}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) blockquote{margin:1.2em 0;orphans:2;padding:.8em 1.2em;widows:2;page-break-inside:avoid;border-left:4px solid #ccc;break-inside:avoid}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{margin:1.2em 0;orphans:1;widows:1;page-break-inside:avoid;break-inside:avoid;page-break-before:avoid;break-before:avoid;page-break-after:avoid;break-after:avoid}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code{hyphens:none;overflow-wrap:break-word;word-break:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) table{margin:1.2em 0;orphans:1;widows:1;page-break-inside:avoid;break-inside:avoid;page-break-before:avoid;break-before:avoid;page-break-after:avoid;break-after:avoid}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) tr{page-break-inside:avoid;break-inside:avoid}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) img{page-break-inside:avoid;break-inside:avoid;page-break-before:avoid;break-before:avoid;page-break-after:avoid;break-after:avoid;display:block;margin:1em auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) hr{page-break-after:avoid;break-after:avoid;page-break-before:avoid;border:none;border-top:1px solid #ccc;break-before:avoid;height:0;margin:2em auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) a,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) b,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) em,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) i,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) strong{overflow-wrap:break-word;word-break:break-word}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)>*{page-break-inside:auto;break-inside:auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)>:not(h1):not(h2):not(pre):not(table):not(img){page-break-after:auto;break-after:auto}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)>h1:not(:first-of-type){page-break-before:always;break-before:page;margin-top:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)>:first-child{margin-top:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref)>:last-child{margin-bottom:0}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-narrow{page:narrow}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-wide{page:wide}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-letter{page:letter}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-legal{page:legal}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-professional{page:professional}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-booklet{page:booklet}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-draft{page:draft}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-chapter{page-break-before:always;break-before:page}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) .print-section{page-break-before:avoid;break-before:avoid}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) code,:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) pre{white-space:pre-wrap!important;word-break:break-word!important}:where(h1:first-child,h2){break-before:auto}h2:has(+h3){break-before:recto}h1:not(:first-child){break-after:auto;break-before:recto;break-inside:auto}:has(+h1){break-after:auto}h1~h2:first-of-type{break-before:auto}:where(table)+h2{break-before:recto}hr:has(+h1,+h2,+h3,+h4,+h5,+h6){break-after:verso}:where(table,pre,code,p,ul,ol,li){break-after:auto;break-before:auto;break-inside:avoid-page}:where(hr,p,ol,li,table,blockquote,pre,code,strong)+:where(h1,h2,h3,h4,h5,h6){break-before:recto}:where(hr,p,ol,li,table,blockquote,pre,code,strong):has(+h1,+h2,+h3,+h4,+h5,+h6){break-after:auto}:where(hr,p,ol,li,table,blockquote,pre,code,strong):not(hr):has(+h2){break-after:recto}:where(hr,p,ol,li,table,blockquote,pre,code,strong):has(+p,+pre,+code,+ol,+li,+table,+blockquote,+strong){break-after:avoid-page}:where(hr,p,ol,li,table,blockquote,pre,code,strong)+:where(p,ol,li,table,blockquote,strong){break-before:avoid-page}:where(hr,p,ol,li,table,blockquote,pre,code,strong)+hr+:where(h1,h2):has(+:where(p,ol,ul,blockquote)){break-before:recto}:where(.pb,.np,.pagebreak,.newpage,.page-break,.new-page){background-color:initial;page-break-after:always;break-after:page;break-before:auto;break-inside:auto}:where(h1,h2,h3,h4,h5,h6):has(+:where(hr,p,ul,ol,li,table,blockquote,pre,code)){break-after:avoid-page;break-before:auto}:where(h1,h2):has(+:where(p,table,hr)){break-before:recto}}:where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content):not(.katex,.footnote-ref,.footnote-backref) *{color-scheme:inherit;contain-intrinsic-block-size:auto 1em}[data-hidden] :where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content){color-scheme:inherit;content-visibility:auto!important}:where([data-hidden],[data-dragging]):where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content){content-visibility:auto!important}[data-dragging] :where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content){color-scheme:inherit;content-visibility:auto!important}[data-dragging] :where(:host,.markdown-body,#markdown,md-view,#raw-md,.markdown-viewer,.print-view,.markdown-viewer-container .viewer-content .markdown-viewer-content) :where(*){content-visibility:auto!important}.footnote-backref,.footnote-ref,.katex{font-variant-alternates:normal;font-variant-caps:small-caps;font-variant-east-asian:jis78;font-variant-emoji:text;font-variant-ligatures:common-ligatures;font-variant-numeric:tabular-nums}.footnote-backref,.footnote-backref *,.footnote-ref,.footnote-ref *,.katex,.katex *{block-size:fit-content;font-family:var(--font-family-serif,\"Times New Roman\");inline-size:fit-content;max-block-size:stretch;max-inline-size:stretch;text-align:start}.footnote-backref span,.footnote-ref span,.katex span{font-style:italic}}@layer overrides{@media print{:where(h1:first-child,h2){break-before:auto}h2:has(+h3){break-before:recto}h1:not(:first-child){break-after:auto;break-before:recto;break-inside:auto}:has(+h1){break-after:auto}h1~h2:first-of-type{break-before:auto}:where(table)+h2{break-before:recto}hr:has(+h1,+h2,+h3,+h4,+h5,+h6){break-after:verso}:where(table,pre,code,p,ul,ol,li){break-after:auto;break-before:auto;break-inside:avoid-page}:where(hr,p,ol,li,table,blockquote,pre,code,strong)+:where(h1,h2,h3,h4,h5,h6){break-before:recto}:where(hr,p,ol,li,table,blockquote,pre,code,strong):has(+h1,+h2,+h3,+h4,+h5,+h6){break-after:auto}:where(hr,p,ol,li,table,blockquote,pre,code,strong):not(hr):has(+h2){break-after:recto}:where(hr,p,ol,li,table,blockquote,pre,code,strong):has(+p,+pre,+code,+ol,+li,+table,+blockquote,+strong){break-after:avoid-page}:where(hr,p,ol,li,table,blockquote,pre,code,strong)+:where(p,ol,li,table,blockquote,strong){break-before:avoid-page}:where(hr,p,ol,li,table,blockquote,pre,code,strong)+hr+:where(h1,h2):has(+:where(p,ol,ul,blockquote)){break-before:recto}:where(.pb,.np,.pagebreak,.newpage,.page-break,.new-page){background-color:initial;page-break-after:always;break-after:page;break-before:auto;break-inside:auto}:where(h1,h2,h3,h4,h5,h6):has(+:where(hr,p,ul,ol,li,table,blockquote,pre,code)){break-after:avoid-page;break-before:auto}:where(h1,h2):has(+:where(p,table,hr)){break-before:recto}h1:first-of-type{break-before:avoid;page-break-before:avoid}}}";

/*! @license DOMPurify 3.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.1/LICENSE */

var purify_cjs;
var hasRequiredPurify_cjs;

function requirePurify_cjs () {
	if (hasRequiredPurify_cjs) return purify_cjs;
	hasRequiredPurify_cjs = 1;

	const {
	  entries,
	  setPrototypeOf,
	  isFrozen,
	  getPrototypeOf,
	  getOwnPropertyDescriptor
	} = Object;
	let {
	  freeze,
	  seal,
	  create
	} = Object; // eslint-disable-line import/no-mutable-exports
	let {
	  apply,
	  construct
	} = typeof Reflect !== 'undefined' && Reflect;
	if (!freeze) {
	  freeze = function freeze(x) {
	    return x;
	  };
	}
	if (!seal) {
	  seal = function seal(x) {
	    return x;
	  };
	}
	if (!apply) {
	  apply = function apply(func, thisArg) {
	    for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
	      args[_key - 2] = arguments[_key];
	    }
	    return func.apply(thisArg, args);
	  };
	}
	if (!construct) {
	  construct = function construct(Func) {
	    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	      args[_key2 - 1] = arguments[_key2];
	    }
	    return new Func(...args);
	  };
	}
	const arrayForEach = unapply(Array.prototype.forEach);
	const arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
	const arrayPop = unapply(Array.prototype.pop);
	const arrayPush = unapply(Array.prototype.push);
	const arraySplice = unapply(Array.prototype.splice);
	const stringToLowerCase = unapply(String.prototype.toLowerCase);
	const stringToString = unapply(String.prototype.toString);
	const stringMatch = unapply(String.prototype.match);
	const stringReplace = unapply(String.prototype.replace);
	const stringIndexOf = unapply(String.prototype.indexOf);
	const stringTrim = unapply(String.prototype.trim);
	const objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
	const regExpTest = unapply(RegExp.prototype.test);
	const typeErrorCreate = unconstruct(TypeError);
	/**
	 * Creates a new function that calls the given function with a specified thisArg and arguments.
	 *
	 * @param func - The function to be wrapped and called.
	 * @returns A new function that calls the given function with a specified thisArg and arguments.
	 */
	function unapply(func) {
	  return function (thisArg) {
	    if (thisArg instanceof RegExp) {
	      thisArg.lastIndex = 0;
	    }
	    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
	      args[_key3 - 1] = arguments[_key3];
	    }
	    return apply(func, thisArg, args);
	  };
	}
	/**
	 * Creates a new function that constructs an instance of the given constructor function with the provided arguments.
	 *
	 * @param func - The constructor function to be wrapped and called.
	 * @returns A new function that constructs an instance of the given constructor function with the provided arguments.
	 */
	function unconstruct(Func) {
	  return function () {
	    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	      args[_key4] = arguments[_key4];
	    }
	    return construct(Func, args);
	  };
	}
	/**
	 * Add properties to a lookup table
	 *
	 * @param set - The set to which elements will be added.
	 * @param array - The array containing elements to be added to the set.
	 * @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
	 * @returns The modified set with added elements.
	 */
	function addToSet(set, array) {
	  let transformCaseFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : stringToLowerCase;
	  if (setPrototypeOf) {
	    // Make 'in' and truthy checks like Boolean(set.constructor)
	    // independent of any properties defined on Object.prototype.
	    // Prevent prototype setters from intercepting set as a this value.
	    setPrototypeOf(set, null);
	  }
	  let l = array.length;
	  while (l--) {
	    let element = array[l];
	    if (typeof element === 'string') {
	      const lcElement = transformCaseFunc(element);
	      if (lcElement !== element) {
	        // Config presets (e.g. tags.js, attrs.js) are immutable.
	        if (!isFrozen(array)) {
	          array[l] = lcElement;
	        }
	        element = lcElement;
	      }
	    }
	    set[element] = true;
	  }
	  return set;
	}
	/**
	 * Clean up an array to harden against CSPP
	 *
	 * @param array - The array to be cleaned.
	 * @returns The cleaned version of the array
	 */
	function cleanArray(array) {
	  for (let index = 0; index < array.length; index++) {
	    const isPropertyExist = objectHasOwnProperty(array, index);
	    if (!isPropertyExist) {
	      array[index] = null;
	    }
	  }
	  return array;
	}
	/**
	 * Shallow clone an object
	 *
	 * @param object - The object to be cloned.
	 * @returns A new object that copies the original.
	 */
	function clone(object) {
	  const newObject = create(null);
	  for (const [property, value] of entries(object)) {
	    const isPropertyExist = objectHasOwnProperty(object, property);
	    if (isPropertyExist) {
	      if (Array.isArray(value)) {
	        newObject[property] = cleanArray(value);
	      } else if (value && typeof value === 'object' && value.constructor === Object) {
	        newObject[property] = clone(value);
	      } else {
	        newObject[property] = value;
	      }
	    }
	  }
	  return newObject;
	}
	/**
	 * This method automatically checks if the prop is function or getter and behaves accordingly.
	 *
	 * @param object - The object to look up the getter function in its prototype chain.
	 * @param prop - The property name for which to find the getter function.
	 * @returns The getter function found in the prototype chain or a fallback function.
	 */
	function lookupGetter(object, prop) {
	  while (object !== null) {
	    const desc = getOwnPropertyDescriptor(object, prop);
	    if (desc) {
	      if (desc.get) {
	        return unapply(desc.get);
	      }
	      if (typeof desc.value === 'function') {
	        return unapply(desc.value);
	      }
	    }
	    object = getPrototypeOf(object);
	  }
	  function fallbackValue() {
	    return null;
	  }
	  return fallbackValue;
	}

	const html$1 = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'search', 'section', 'select', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);
	const svg$1 = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'enterkeyhint', 'exportparts', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'inputmode', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'part', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'view', 'vkern']);
	const svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);
	// List of SVG elements that are disallowed by default.
	// We still need to know them so that we can do namespace
	// checks properly in case one wants to add them to
	// allow-list.
	const svgDisallowed = freeze(['animate', 'color-profile', 'cursor', 'discard', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignobject', 'hatch', 'hatchpath', 'mesh', 'meshgradient', 'meshpatch', 'meshrow', 'missing-glyph', 'script', 'set', 'solidcolor', 'unknown', 'use']);
	const mathMl$1 = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'mprescripts']);
	// Similarly to SVG, we want to know all MathML elements,
	// even those that we disallow by default.
	const mathMlDisallowed = freeze(['maction', 'maligngroup', 'malignmark', 'mlongdiv', 'mscarries', 'mscarry', 'msgroup', 'mstack', 'msline', 'msrow', 'semantics', 'annotation', 'annotation-xml', 'mprescripts', 'none']);
	const text = freeze(['#text']);

	const html = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'exportparts', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inert', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'nonce', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'part', 'pattern', 'placeholder', 'playsinline', 'popover', 'popovertarget', 'popovertargetaction', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'slot', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'wrap', 'xmlns', 'slot']);
	const svg = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'amplitude', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clippathunits', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'exponent', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'intercept', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'mask-type', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'slope', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'systemlanguage', 'tabindex', 'tablevalues', 'targetx', 'targety', 'transform', 'transform-origin', 'text-anchor', 'text-decoration', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);
	const mathMl = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnsalign', 'columnlines', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lspace', 'lquote', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);
	const xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);

	// eslint-disable-next-line unicorn/better-regex
	const MUSTACHE_EXPR = seal(/\{\{[\w\W]*|[\w\W]*\}\}/gm); // Specify template detection regex for SAFE_FOR_TEMPLATES mode
	const ERB_EXPR = seal(/<%[\w\W]*|[\w\W]*%>/gm);
	const TMPLIT_EXPR = seal(/\$\{[\w\W]*/gm); // eslint-disable-line unicorn/better-regex
	const DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/); // eslint-disable-line no-useless-escape
	const ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
	const IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
	);
	const IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
	const ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g // eslint-disable-line no-control-regex
	);
	const DOCTYPE_NAME = seal(/^html$/i);
	const CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);

	var EXPRESSIONS = /*#__PURE__*/Object.freeze({
	  __proto__: null,
	  ARIA_ATTR: ARIA_ATTR,
	  ATTR_WHITESPACE: ATTR_WHITESPACE,
	  CUSTOM_ELEMENT: CUSTOM_ELEMENT,
	  DATA_ATTR: DATA_ATTR,
	  DOCTYPE_NAME: DOCTYPE_NAME,
	  ERB_EXPR: ERB_EXPR,
	  IS_ALLOWED_URI: IS_ALLOWED_URI,
	  IS_SCRIPT_OR_DATA: IS_SCRIPT_OR_DATA,
	  MUSTACHE_EXPR: MUSTACHE_EXPR,
	  TMPLIT_EXPR: TMPLIT_EXPR
	});

	/* eslint-disable @typescript-eslint/indent */
	// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
	const NODE_TYPE = {
	  element: 1,
	  text: 3,
	  // Deprecated
	  progressingInstruction: 7,
	  comment: 8,
	  document: 9};
	const getGlobal = function getGlobal() {
	  return typeof window === 'undefined' ? null : window;
	};
	/**
	 * Creates a no-op policy for internal use only.
	 * Don't export this function outside this module!
	 * @param trustedTypes The policy factory.
	 * @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
	 * @return The policy created (or null, if Trusted Types
	 * are not supported or creating the policy failed).
	 */
	const _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
	  if (typeof trustedTypes !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
	    return null;
	  }
	  // Allow the callers to control the unique policy name
	  // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
	  // Policy creation with duplicate names throws in Trusted Types.
	  let suffix = null;
	  const ATTR_NAME = 'data-tt-policy-suffix';
	  if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) {
	    suffix = purifyHostElement.getAttribute(ATTR_NAME);
	  }
	  const policyName = 'dompurify' + (suffix ? '#' + suffix : '');
	  try {
	    return trustedTypes.createPolicy(policyName, {
	      createHTML(html) {
	        return html;
	      },
	      createScriptURL(scriptUrl) {
	        return scriptUrl;
	      }
	    });
	  } catch (_) {
	    // Policy creation failed (most likely another DOMPurify script has
	    // already run). Skip creating the policy, as this will only cause errors
	    // if TT are enforced.
	    console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
	    return null;
	  }
	};
	const _createHooksMap = function _createHooksMap() {
	  return {
	    afterSanitizeAttributes: [],
	    afterSanitizeElements: [],
	    afterSanitizeShadowDOM: [],
	    beforeSanitizeAttributes: [],
	    beforeSanitizeElements: [],
	    beforeSanitizeShadowDOM: [],
	    uponSanitizeAttribute: [],
	    uponSanitizeElement: [],
	    uponSanitizeShadowNode: []
	  };
	};
	function createDOMPurify() {
	  let window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();
	  const DOMPurify = root => createDOMPurify(root);
	  DOMPurify.version = '3.3.1';
	  DOMPurify.removed = [];
	  if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
	    // Not running in a browser, provide a factory function
	    // so that you can pass your own Window
	    DOMPurify.isSupported = false;
	    return DOMPurify;
	  }
	  let {
	    document
	  } = window;
	  const originalDocument = document;
	  const currentScript = originalDocument.currentScript;
	  const {
	    DocumentFragment,
	    HTMLTemplateElement,
	    Node,
	    Element,
	    NodeFilter,
	    NamedNodeMap = window.NamedNodeMap || window.MozNamedAttrMap,
	    HTMLFormElement,
	    DOMParser,
	    trustedTypes
	  } = window;
	  const ElementPrototype = Element.prototype;
	  const cloneNode = lookupGetter(ElementPrototype, 'cloneNode');
	  const remove = lookupGetter(ElementPrototype, 'remove');
	  const getNextSibling = lookupGetter(ElementPrototype, 'nextSibling');
	  const getChildNodes = lookupGetter(ElementPrototype, 'childNodes');
	  const getParentNode = lookupGetter(ElementPrototype, 'parentNode');
	  // As per issue #47, the web-components registry is inherited by a
	  // new document created via createHTMLDocument. As per the spec
	  // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
	  // a new empty registry is used when creating a template contents owner
	  // document, so we use that as our parent document to ensure nothing
	  // is inherited.
	  if (typeof HTMLTemplateElement === 'function') {
	    const template = document.createElement('template');
	    if (template.content && template.content.ownerDocument) {
	      document = template.content.ownerDocument;
	    }
	  }
	  let trustedTypesPolicy;
	  let emptyHTML = '';
	  const {
	    implementation,
	    createNodeIterator,
	    createDocumentFragment,
	    getElementsByTagName
	  } = document;
	  const {
	    importNode
	  } = originalDocument;
	  let hooks = _createHooksMap();
	  /**
	   * Expose whether this browser supports running the full DOMPurify.
	   */
	  DOMPurify.isSupported = typeof entries === 'function' && typeof getParentNode === 'function' && implementation && implementation.createHTMLDocument !== undefined;
	  const {
	    MUSTACHE_EXPR,
	    ERB_EXPR,
	    TMPLIT_EXPR,
	    DATA_ATTR,
	    ARIA_ATTR,
	    IS_SCRIPT_OR_DATA,
	    ATTR_WHITESPACE,
	    CUSTOM_ELEMENT
	  } = EXPRESSIONS;
	  let {
	    IS_ALLOWED_URI: IS_ALLOWED_URI$1
	  } = EXPRESSIONS;
	  /**
	   * We consider the elements and attributes below to be safe. Ideally
	   * don't add any new ones but feel free to remove unwanted ones.
	   */
	  /* allowed element names */
	  let ALLOWED_TAGS = null;
	  const DEFAULT_ALLOWED_TAGS = addToSet({}, [...html$1, ...svg$1, ...svgFilters, ...mathMl$1, ...text]);
	  /* Allowed attribute names */
	  let ALLOWED_ATTR = null;
	  const DEFAULT_ALLOWED_ATTR = addToSet({}, [...html, ...svg, ...mathMl, ...xml]);
	  /*
	   * Configure how DOMPurify should handle custom elements and their attributes as well as customized built-in elements.
	   * @property {RegExp|Function|null} tagNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any custom elements)
	   * @property {RegExp|Function|null} attributeNameCheck one of [null, regexPattern, predicate]. Default: `null` (disallow any attributes not on the allow list)
	   * @property {boolean} allowCustomizedBuiltInElements allow custom elements derived from built-ins if they pass CUSTOM_ELEMENT_HANDLING.tagNameCheck. Default: `false`.
	   */
	  let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
	    tagNameCheck: {
	      writable: true,
	      configurable: false,
	      enumerable: true,
	      value: null
	    },
	    attributeNameCheck: {
	      writable: true,
	      configurable: false,
	      enumerable: true,
	      value: null
	    },
	    allowCustomizedBuiltInElements: {
	      writable: true,
	      configurable: false,
	      enumerable: true,
	      value: false
	    }
	  }));
	  /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
	  let FORBID_TAGS = null;
	  /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
	  let FORBID_ATTR = null;
	  /* Config object to store ADD_TAGS/ADD_ATTR functions (when used as functions) */
	  const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
	    tagCheck: {
	      writable: true,
	      configurable: false,
	      enumerable: true,
	      value: null
	    },
	    attributeCheck: {
	      writable: true,
	      configurable: false,
	      enumerable: true,
	      value: null
	    }
	  }));
	  /* Decide if ARIA attributes are okay */
	  let ALLOW_ARIA_ATTR = true;
	  /* Decide if custom data attributes are okay */
	  let ALLOW_DATA_ATTR = true;
	  /* Decide if unknown protocols are okay */
	  let ALLOW_UNKNOWN_PROTOCOLS = false;
	  /* Decide if self-closing tags in attributes are allowed.
	   * Usually removed due to a mXSS issue in jQuery 3.0 */
	  let ALLOW_SELF_CLOSE_IN_ATTR = true;
	  /* Output should be safe for common template engines.
	   * This means, DOMPurify removes data attributes, mustaches and ERB
	   */
	  let SAFE_FOR_TEMPLATES = false;
	  /* Output should be safe even for XML used within HTML and alike.
	   * This means, DOMPurify removes comments when containing risky content.
	   */
	  let SAFE_FOR_XML = true;
	  /* Decide if document with <html>... should be returned */
	  let WHOLE_DOCUMENT = false;
	  /* Track whether config is already set on this instance of DOMPurify. */
	  let SET_CONFIG = false;
	  /* Decide if all elements (e.g. style, script) must be children of
	   * document.body. By default, browsers might move them to document.head */
	  let FORCE_BODY = false;
	  /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
	   * string (or a TrustedHTML object if Trusted Types are supported).
	   * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
	   */
	  let RETURN_DOM = false;
	  /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
	   * string  (or a TrustedHTML object if Trusted Types are supported) */
	  let RETURN_DOM_FRAGMENT = false;
	  /* Try to return a Trusted Type object instead of a string, return a string in
	   * case Trusted Types are not supported  */
	  let RETURN_TRUSTED_TYPE = false;
	  /* Output should be free from DOM clobbering attacks?
	   * This sanitizes markups named with colliding, clobberable built-in DOM APIs.
	   */
	  let SANITIZE_DOM = true;
	  /* Achieve full DOM Clobbering protection by isolating the namespace of named
	   * properties and JS variables, mitigating attacks that abuse the HTML/DOM spec rules.
	   *
	   * HTML/DOM spec rules that enable DOM Clobbering:
	   *   - Named Access on Window (§7.3.3)
	   *   - DOM Tree Accessors (§3.1.5)
	   *   - Form Element Parent-Child Relations (§4.10.3)
	   *   - Iframe srcdoc / Nested WindowProxies (§4.8.5)
	   *   - HTMLCollection (§4.2.10.2)
	   *
	   * Namespace isolation is implemented by prefixing `id` and `name` attributes
	   * with a constant string, i.e., `user-content-`
	   */
	  let SANITIZE_NAMED_PROPS = false;
	  const SANITIZE_NAMED_PROPS_PREFIX = 'user-content-';
	  /* Keep element content when removing element? */
	  let KEEP_CONTENT = true;
	  /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
	   * of importing it into a new Document and returning a sanitized copy */
	  let IN_PLACE = false;
	  /* Allow usage of profiles like html, svg and mathMl */
	  let USE_PROFILES = {};
	  /* Tags to ignore content of when KEEP_CONTENT is true */
	  let FORBID_CONTENTS = null;
	  const DEFAULT_FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'noscript', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);
	  /* Tags that are safe for data: URIs */
	  let DATA_URI_TAGS = null;
	  const DEFAULT_DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);
	  /* Attributes safe for values like "javascript:" */
	  let URI_SAFE_ATTRIBUTES = null;
	  const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'role', 'summary', 'title', 'value', 'style', 'xmlns']);
	  const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
	  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
	  const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
	  /* Document namespace */
	  let NAMESPACE = HTML_NAMESPACE;
	  let IS_EMPTY_INPUT = false;
	  /* Allowed XHTML+XML namespaces */
	  let ALLOWED_NAMESPACES = null;
	  const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [MATHML_NAMESPACE, SVG_NAMESPACE, HTML_NAMESPACE], stringToString);
	  let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, ['mi', 'mo', 'mn', 'ms', 'mtext']);
	  let HTML_INTEGRATION_POINTS = addToSet({}, ['annotation-xml']);
	  // Certain elements are allowed in both SVG and HTML
	  // namespace. We need to specify them explicitly
	  // so that they don't get erroneously deleted from
	  // HTML namespace.
	  const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, ['title', 'style', 'font', 'a', 'script']);
	  /* Parsing of strict XHTML documents */
	  let PARSER_MEDIA_TYPE = null;
	  const SUPPORTED_PARSER_MEDIA_TYPES = ['application/xhtml+xml', 'text/html'];
	  const DEFAULT_PARSER_MEDIA_TYPE = 'text/html';
	  let transformCaseFunc = null;
	  /* Keep a reference to config to pass to hooks */
	  let CONFIG = null;
	  /* Ideally, do not touch anything below this line */
	  /* ______________________________________________ */
	  const formElement = document.createElement('form');
	  const isRegexOrFunction = function isRegexOrFunction(testValue) {
	    return testValue instanceof RegExp || testValue instanceof Function;
	  };
	  /**
	   * _parseConfig
	   *
	   * @param cfg optional config literal
	   */
	  // eslint-disable-next-line complexity
	  const _parseConfig = function _parseConfig() {
	    let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    if (CONFIG && CONFIG === cfg) {
	      return;
	    }
	    /* Shield configuration object from tampering */
	    if (!cfg || typeof cfg !== 'object') {
	      cfg = {};
	    }
	    /* Shield configuration object from prototype pollution */
	    cfg = clone(cfg);
	    PARSER_MEDIA_TYPE =
	    // eslint-disable-next-line unicorn/prefer-includes
	    SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
	    // HTML tags and attributes are not case-sensitive, converting to lowercase. Keeping XHTML as is.
	    transformCaseFunc = PARSER_MEDIA_TYPE === 'application/xhtml+xml' ? stringToString : stringToLowerCase;
	    /* Set configuration parameters */
	    ALLOWED_TAGS = objectHasOwnProperty(cfg, 'ALLOWED_TAGS') ? addToSet({}, cfg.ALLOWED_TAGS, transformCaseFunc) : DEFAULT_ALLOWED_TAGS;
	    ALLOWED_ATTR = objectHasOwnProperty(cfg, 'ALLOWED_ATTR') ? addToSet({}, cfg.ALLOWED_ATTR, transformCaseFunc) : DEFAULT_ALLOWED_ATTR;
	    ALLOWED_NAMESPACES = objectHasOwnProperty(cfg, 'ALLOWED_NAMESPACES') ? addToSet({}, cfg.ALLOWED_NAMESPACES, stringToString) : DEFAULT_ALLOWED_NAMESPACES;
	    URI_SAFE_ATTRIBUTES = objectHasOwnProperty(cfg, 'ADD_URI_SAFE_ATTR') ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR, transformCaseFunc) : DEFAULT_URI_SAFE_ATTRIBUTES;
	    DATA_URI_TAGS = objectHasOwnProperty(cfg, 'ADD_DATA_URI_TAGS') ? addToSet(clone(DEFAULT_DATA_URI_TAGS), cfg.ADD_DATA_URI_TAGS, transformCaseFunc) : DEFAULT_DATA_URI_TAGS;
	    FORBID_CONTENTS = objectHasOwnProperty(cfg, 'FORBID_CONTENTS') ? addToSet({}, cfg.FORBID_CONTENTS, transformCaseFunc) : DEFAULT_FORBID_CONTENTS;
	    FORBID_TAGS = objectHasOwnProperty(cfg, 'FORBID_TAGS') ? addToSet({}, cfg.FORBID_TAGS, transformCaseFunc) : clone({});
	    FORBID_ATTR = objectHasOwnProperty(cfg, 'FORBID_ATTR') ? addToSet({}, cfg.FORBID_ATTR, transformCaseFunc) : clone({});
	    USE_PROFILES = objectHasOwnProperty(cfg, 'USE_PROFILES') ? cfg.USE_PROFILES : false;
	    ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
	    ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
	    ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
	    ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false; // Default true
	    SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
	    SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false; // Default true
	    WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
	    RETURN_DOM = cfg.RETURN_DOM || false; // Default false
	    RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
	    RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
	    FORCE_BODY = cfg.FORCE_BODY || false; // Default false
	    SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
	    SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false; // Default false
	    KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
	    IN_PLACE = cfg.IN_PLACE || false; // Default false
	    IS_ALLOWED_URI$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI;
	    NAMESPACE = cfg.NAMESPACE || HTML_NAMESPACE;
	    MATHML_TEXT_INTEGRATION_POINTS = cfg.MATHML_TEXT_INTEGRATION_POINTS || MATHML_TEXT_INTEGRATION_POINTS;
	    HTML_INTEGRATION_POINTS = cfg.HTML_INTEGRATION_POINTS || HTML_INTEGRATION_POINTS;
	    CUSTOM_ELEMENT_HANDLING = cfg.CUSTOM_ELEMENT_HANDLING || {};
	    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck)) {
	      CUSTOM_ELEMENT_HANDLING.tagNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.tagNameCheck;
	    }
	    if (cfg.CUSTOM_ELEMENT_HANDLING && isRegexOrFunction(cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)) {
	      CUSTOM_ELEMENT_HANDLING.attributeNameCheck = cfg.CUSTOM_ELEMENT_HANDLING.attributeNameCheck;
	    }
	    if (cfg.CUSTOM_ELEMENT_HANDLING && typeof cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements === 'boolean') {
	      CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = cfg.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements;
	    }
	    if (SAFE_FOR_TEMPLATES) {
	      ALLOW_DATA_ATTR = false;
	    }
	    if (RETURN_DOM_FRAGMENT) {
	      RETURN_DOM = true;
	    }
	    /* Parse profile info */
	    if (USE_PROFILES) {
	      ALLOWED_TAGS = addToSet({}, text);
	      ALLOWED_ATTR = [];
	      if (USE_PROFILES.html === true) {
	        addToSet(ALLOWED_TAGS, html$1);
	        addToSet(ALLOWED_ATTR, html);
	      }
	      if (USE_PROFILES.svg === true) {
	        addToSet(ALLOWED_TAGS, svg$1);
	        addToSet(ALLOWED_ATTR, svg);
	        addToSet(ALLOWED_ATTR, xml);
	      }
	      if (USE_PROFILES.svgFilters === true) {
	        addToSet(ALLOWED_TAGS, svgFilters);
	        addToSet(ALLOWED_ATTR, svg);
	        addToSet(ALLOWED_ATTR, xml);
	      }
	      if (USE_PROFILES.mathMl === true) {
	        addToSet(ALLOWED_TAGS, mathMl$1);
	        addToSet(ALLOWED_ATTR, mathMl);
	        addToSet(ALLOWED_ATTR, xml);
	      }
	    }
	    /* Merge configuration parameters */
	    if (cfg.ADD_TAGS) {
	      if (typeof cfg.ADD_TAGS === 'function') {
	        EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
	      } else {
	        if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
	          ALLOWED_TAGS = clone(ALLOWED_TAGS);
	        }
	        addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
	      }
	    }
	    if (cfg.ADD_ATTR) {
	      if (typeof cfg.ADD_ATTR === 'function') {
	        EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
	      } else {
	        if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
	          ALLOWED_ATTR = clone(ALLOWED_ATTR);
	        }
	        addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
	      }
	    }
	    if (cfg.ADD_URI_SAFE_ATTR) {
	      addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR, transformCaseFunc);
	    }
	    if (cfg.FORBID_CONTENTS) {
	      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
	        FORBID_CONTENTS = clone(FORBID_CONTENTS);
	      }
	      addToSet(FORBID_CONTENTS, cfg.FORBID_CONTENTS, transformCaseFunc);
	    }
	    if (cfg.ADD_FORBID_CONTENTS) {
	      if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) {
	        FORBID_CONTENTS = clone(FORBID_CONTENTS);
	      }
	      addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
	    }
	    /* Add #text in case KEEP_CONTENT is set to true */
	    if (KEEP_CONTENT) {
	      ALLOWED_TAGS['#text'] = true;
	    }
	    /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
	    if (WHOLE_DOCUMENT) {
	      addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
	    }
	    /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
	    if (ALLOWED_TAGS.table) {
	      addToSet(ALLOWED_TAGS, ['tbody']);
	      delete FORBID_TAGS.tbody;
	    }
	    if (cfg.TRUSTED_TYPES_POLICY) {
	      if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== 'function') {
	        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
	      }
	      if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== 'function') {
	        throw typeErrorCreate('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
	      }
	      // Overwrite existing TrustedTypes policy.
	      trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
	      // Sign local variables required by `sanitize`.
	      emptyHTML = trustedTypesPolicy.createHTML('');
	    } else {
	      // Uninitialized policy, attempt to initialize the internal dompurify policy.
	      if (trustedTypesPolicy === undefined) {
	        trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
	      }
	      // If creating the internal policy succeeded sign internal variables.
	      if (trustedTypesPolicy !== null && typeof emptyHTML === 'string') {
	        emptyHTML = trustedTypesPolicy.createHTML('');
	      }
	    }
	    // Prevent further manipulation of configuration.
	    // Not available in IE8, Safari 5, etc.
	    if (freeze) {
	      freeze(cfg);
	    }
	    CONFIG = cfg;
	  };
	  /* Keep track of all possible SVG and MathML tags
	   * so that we can perform the namespace checks
	   * correctly. */
	  const ALL_SVG_TAGS = addToSet({}, [...svg$1, ...svgFilters, ...svgDisallowed]);
	  const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
	  /**
	   * @param element a DOM element whose namespace is being checked
	   * @returns Return false if the element has a
	   *  namespace that a spec-compliant parser would never
	   *  return. Return true otherwise.
	   */
	  const _checkValidNamespace = function _checkValidNamespace(element) {
	    let parent = getParentNode(element);
	    // In JSDOM, if we're inside shadow DOM, then parentNode
	    // can be null. We just simulate parent in this case.
	    if (!parent || !parent.tagName) {
	      parent = {
	        namespaceURI: NAMESPACE,
	        tagName: 'template'
	      };
	    }
	    const tagName = stringToLowerCase(element.tagName);
	    const parentTagName = stringToLowerCase(parent.tagName);
	    if (!ALLOWED_NAMESPACES[element.namespaceURI]) {
	      return false;
	    }
	    if (element.namespaceURI === SVG_NAMESPACE) {
	      // The only way to switch from HTML namespace to SVG
	      // is via <svg>. If it happens via any other tag, then
	      // it should be killed.
	      if (parent.namespaceURI === HTML_NAMESPACE) {
	        return tagName === 'svg';
	      }
	      // The only way to switch from MathML to SVG is via`
	      // svg if parent is either <annotation-xml> or MathML
	      // text integration points.
	      if (parent.namespaceURI === MATHML_NAMESPACE) {
	        return tagName === 'svg' && (parentTagName === 'annotation-xml' || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
	      }
	      // We only allow elements that are defined in SVG
	      // spec. All others are disallowed in SVG namespace.
	      return Boolean(ALL_SVG_TAGS[tagName]);
	    }
	    if (element.namespaceURI === MATHML_NAMESPACE) {
	      // The only way to switch from HTML namespace to MathML
	      // is via <math>. If it happens via any other tag, then
	      // it should be killed.
	      if (parent.namespaceURI === HTML_NAMESPACE) {
	        return tagName === 'math';
	      }
	      // The only way to switch from SVG to MathML is via
	      // <math> and HTML integration points
	      if (parent.namespaceURI === SVG_NAMESPACE) {
	        return tagName === 'math' && HTML_INTEGRATION_POINTS[parentTagName];
	      }
	      // We only allow elements that are defined in MathML
	      // spec. All others are disallowed in MathML namespace.
	      return Boolean(ALL_MATHML_TAGS[tagName]);
	    }
	    if (element.namespaceURI === HTML_NAMESPACE) {
	      // The only way to switch from SVG to HTML is via
	      // HTML integration points, and from MathML to HTML
	      // is via MathML text integration points
	      if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) {
	        return false;
	      }
	      if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) {
	        return false;
	      }
	      // We disallow tags that are specific for MathML
	      // or SVG and should never appear in HTML namespace
	      return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
	    }
	    // For XHTML and XML documents that support custom namespaces
	    if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && ALLOWED_NAMESPACES[element.namespaceURI]) {
	      return true;
	    }
	    // The code should never reach this place (this means
	    // that the element somehow got namespace that is not
	    // HTML, SVG, MathML or allowed via ALLOWED_NAMESPACES).
	    // Return false just in case.
	    return false;
	  };
	  /**
	   * _forceRemove
	   *
	   * @param node a DOM node
	   */
	  const _forceRemove = function _forceRemove(node) {
	    arrayPush(DOMPurify.removed, {
	      element: node
	    });
	    try {
	      // eslint-disable-next-line unicorn/prefer-dom-node-remove
	      getParentNode(node).removeChild(node);
	    } catch (_) {
	      remove(node);
	    }
	  };
	  /**
	   * _removeAttribute
	   *
	   * @param name an Attribute name
	   * @param element a DOM node
	   */
	  const _removeAttribute = function _removeAttribute(name, element) {
	    try {
	      arrayPush(DOMPurify.removed, {
	        attribute: element.getAttributeNode(name),
	        from: element
	      });
	    } catch (_) {
	      arrayPush(DOMPurify.removed, {
	        attribute: null,
	        from: element
	      });
	    }
	    element.removeAttribute(name);
	    // We void attribute values for unremovable "is" attributes
	    if (name === 'is') {
	      if (RETURN_DOM || RETURN_DOM_FRAGMENT) {
	        try {
	          _forceRemove(element);
	        } catch (_) {}
	      } else {
	        try {
	          element.setAttribute(name, '');
	        } catch (_) {}
	      }
	    }
	  };
	  /**
	   * _initDocument
	   *
	   * @param dirty - a string of dirty markup
	   * @return a DOM, filled with the dirty markup
	   */
	  const _initDocument = function _initDocument(dirty) {
	    /* Create a HTML document */
	    let doc = null;
	    let leadingWhitespace = null;
	    if (FORCE_BODY) {
	      dirty = '<remove></remove>' + dirty;
	    } else {
	      /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
	      const matches = stringMatch(dirty, /^[\r\n\t ]+/);
	      leadingWhitespace = matches && matches[0];
	    }
	    if (PARSER_MEDIA_TYPE === 'application/xhtml+xml' && NAMESPACE === HTML_NAMESPACE) {
	      // Root of XHTML doc must contain xmlns declaration (see https://www.w3.org/TR/xhtml1/normative.html#strict)
	      dirty = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + dirty + '</body></html>';
	    }
	    const dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
	    /*
	     * Use the DOMParser API by default, fallback later if needs be
	     * DOMParser not work for svg when has multiple root element.
	     */
	    if (NAMESPACE === HTML_NAMESPACE) {
	      try {
	        doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
	      } catch (_) {}
	    }
	    /* Use createHTMLDocument in case DOMParser is not available */
	    if (!doc || !doc.documentElement) {
	      doc = implementation.createDocument(NAMESPACE, 'template', null);
	      try {
	        doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
	      } catch (_) {
	        // Syntax error if dirtyPayload is invalid xml
	      }
	    }
	    const body = doc.body || doc.documentElement;
	    if (dirty && leadingWhitespace) {
	      body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
	    }
	    /* Work on whole document or just its body */
	    if (NAMESPACE === HTML_NAMESPACE) {
	      return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
	    }
	    return WHOLE_DOCUMENT ? doc.documentElement : body;
	  };
	  /**
	   * Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
	   *
	   * @param root The root element or node to start traversing on.
	   * @return The created NodeIterator
	   */
	  const _createNodeIterator = function _createNodeIterator(root) {
	    return createNodeIterator.call(root.ownerDocument || root, root,
	    // eslint-disable-next-line no-bitwise
	    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
	  };
	  /**
	   * _isClobbered
	   *
	   * @param element element to check for clobbering attacks
	   * @return true if clobbered, false if safe
	   */
	  const _isClobbered = function _isClobbered(element) {
	    return element instanceof HTMLFormElement && (typeof element.nodeName !== 'string' || typeof element.textContent !== 'string' || typeof element.removeChild !== 'function' || !(element.attributes instanceof NamedNodeMap) || typeof element.removeAttribute !== 'function' || typeof element.setAttribute !== 'function' || typeof element.namespaceURI !== 'string' || typeof element.insertBefore !== 'function' || typeof element.hasChildNodes !== 'function');
	  };
	  /**
	   * Checks whether the given object is a DOM node.
	   *
	   * @param value object to check whether it's a DOM node
	   * @return true is object is a DOM node
	   */
	  const _isNode = function _isNode(value) {
	    return typeof Node === 'function' && value instanceof Node;
	  };
	  function _executeHooks(hooks, currentNode, data) {
	    arrayForEach(hooks, hook => {
	      hook.call(DOMPurify, currentNode, data, CONFIG);
	    });
	  }
	  /**
	   * _sanitizeElements
	   *
	   * @protect nodeName
	   * @protect textContent
	   * @protect removeChild
	   * @param currentNode to check for permission to exist
	   * @return true if node was killed, false if left alive
	   */
	  const _sanitizeElements = function _sanitizeElements(currentNode) {
	    let content = null;
	    /* Execute a hook if present */
	    _executeHooks(hooks.beforeSanitizeElements, currentNode, null);
	    /* Check if element is clobbered or can clobber */
	    if (_isClobbered(currentNode)) {
	      _forceRemove(currentNode);
	      return true;
	    }
	    /* Now let's check the element's type and name */
	    const tagName = transformCaseFunc(currentNode.nodeName);
	    /* Execute a hook if present */
	    _executeHooks(hooks.uponSanitizeElement, currentNode, {
	      tagName,
	      allowedTags: ALLOWED_TAGS
	    });
	    /* Detect mXSS attempts abusing namespace confusion */
	    if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(/<[/\w!]/g, currentNode.innerHTML) && regExpTest(/<[/\w!]/g, currentNode.textContent)) {
	      _forceRemove(currentNode);
	      return true;
	    }
	    /* Remove any occurrence of processing instructions */
	    if (currentNode.nodeType === NODE_TYPE.progressingInstruction) {
	      _forceRemove(currentNode);
	      return true;
	    }
	    /* Remove any kind of possibly harmful comments */
	    if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(/<[/\w]/g, currentNode.data)) {
	      _forceRemove(currentNode);
	      return true;
	    }
	    /* Remove element if anything forbids its presence */
	    if (!(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName])) {
	      /* Check if we have a custom element to handle */
	      if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName)) {
	        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) {
	          return false;
	        }
	        if (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(tagName)) {
	          return false;
	        }
	      }
	      /* Keep content except for bad-listed elements */
	      if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
	        const parentNode = getParentNode(currentNode) || currentNode.parentNode;
	        const childNodes = getChildNodes(currentNode) || currentNode.childNodes;
	        if (childNodes && parentNode) {
	          const childCount = childNodes.length;
	          for (let i = childCount - 1; i >= 0; --i) {
	            const childClone = cloneNode(childNodes[i], true);
	            childClone.__removalCount = (currentNode.__removalCount || 0) + 1;
	            parentNode.insertBefore(childClone, getNextSibling(currentNode));
	          }
	        }
	      }
	      _forceRemove(currentNode);
	      return true;
	    }
	    /* Check whether element has a valid namespace */
	    if (currentNode instanceof Element && !_checkValidNamespace(currentNode)) {
	      _forceRemove(currentNode);
	      return true;
	    }
	    /* Make sure that older browsers don't get fallback-tag mXSS */
	    if ((tagName === 'noscript' || tagName === 'noembed' || tagName === 'noframes') && regExpTest(/<\/no(script|embed|frames)/i, currentNode.innerHTML)) {
	      _forceRemove(currentNode);
	      return true;
	    }
	    /* Sanitize element content to be template-safe */
	    if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
	      /* Get the element's text content */
	      content = currentNode.textContent;
	      arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
	        content = stringReplace(content, expr, ' ');
	      });
	      if (currentNode.textContent !== content) {
	        arrayPush(DOMPurify.removed, {
	          element: currentNode.cloneNode()
	        });
	        currentNode.textContent = content;
	      }
	    }
	    /* Execute a hook if present */
	    _executeHooks(hooks.afterSanitizeElements, currentNode, null);
	    return false;
	  };
	  /**
	   * _isValidAttribute
	   *
	   * @param lcTag Lowercase tag name of containing element.
	   * @param lcName Lowercase attribute name.
	   * @param value Attribute value.
	   * @return Returns true if `value` is valid, otherwise false.
	   */
	  // eslint-disable-next-line complexity
	  const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
	    /* Make sure attribute cannot clobber */
	    if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
	      return false;
	    }
	    /* Allow valid data-* attributes: At least one character after "-"
	        (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
	        XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
	        We don't need to check the value; it's always URI safe. */
	    if (ALLOW_DATA_ATTR && !FORBID_ATTR[lcName] && regExpTest(DATA_ATTR, lcName)) ; else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR, lcName)) ; else if (EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag)) ; else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
	      if (
	      // First condition does a very basic check if a) it's basically a valid custom element tagname AND
	      // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
	      // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
	      _isBasicCustomElement(lcTag) && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(lcTag)) && (CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName) || CUSTOM_ELEMENT_HANDLING.attributeNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.attributeNameCheck(lcName, lcTag)) ||
	      // Alternative, second condition checks if it's an `is`-attribute, AND
	      // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
	      lcName === 'is' && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && (CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof RegExp && regExpTest(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value) || CUSTOM_ELEMENT_HANDLING.tagNameCheck instanceof Function && CUSTOM_ELEMENT_HANDLING.tagNameCheck(value))) ; else {
	        return false;
	      }
	      /* Check value is safe. First, is attr inert? If so, is safe */
	    } else if (URI_SAFE_ATTRIBUTES[lcName]) ; else if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE, ''))) ; else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag]) ; else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA, stringReplace(value, ATTR_WHITESPACE, ''))) ; else if (value) {
	      return false;
	    } else ;
	    return true;
	  };
	  /**
	   * _isBasicCustomElement
	   * checks if at least one dash is included in tagName, and it's not the first char
	   * for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
	   *
	   * @param tagName name of the tag of the node to sanitize
	   * @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
	   */
	  const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
	    return tagName !== 'annotation-xml' && stringMatch(tagName, CUSTOM_ELEMENT);
	  };
	  /**
	   * _sanitizeAttributes
	   *
	   * @protect attributes
	   * @protect nodeName
	   * @protect removeAttribute
	   * @protect setAttribute
	   *
	   * @param currentNode to sanitize
	   */
	  const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
	    /* Execute a hook if present */
	    _executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
	    const {
	      attributes
	    } = currentNode;
	    /* Check if we have attributes; if not we might have a text node */
	    if (!attributes || _isClobbered(currentNode)) {
	      return;
	    }
	    const hookEvent = {
	      attrName: '',
	      attrValue: '',
	      keepAttr: true,
	      allowedAttributes: ALLOWED_ATTR,
	      forceKeepAttr: undefined
	    };
	    let l = attributes.length;
	    /* Go backwards over all attributes; safely remove bad ones */
	    while (l--) {
	      const attr = attributes[l];
	      const {
	        name,
	        namespaceURI,
	        value: attrValue
	      } = attr;
	      const lcName = transformCaseFunc(name);
	      const initValue = attrValue;
	      let value = name === 'value' ? initValue : stringTrim(initValue);
	      /* Execute a hook if present */
	      hookEvent.attrName = lcName;
	      hookEvent.attrValue = value;
	      hookEvent.keepAttr = true;
	      hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
	      _executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
	      value = hookEvent.attrValue;
	      /* Full DOM Clobbering protection via namespace isolation,
	       * Prefix id and name attributes with `user-content-`
	       */
	      if (SANITIZE_NAMED_PROPS && (lcName === 'id' || lcName === 'name')) {
	        // Remove the attribute with this value
	        _removeAttribute(name, currentNode);
	        // Prefix the value and later re-create the attribute with the sanitized value
	        value = SANITIZE_NAMED_PROPS_PREFIX + value;
	      }
	      /* Work around a security issue with comments inside attributes */
	      if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|title|textarea)/i, value)) {
	        _removeAttribute(name, currentNode);
	        continue;
	      }
	      /* Make sure we cannot easily use animated hrefs, even if animations are allowed */
	      if (lcName === 'attributename' && stringMatch(value, 'href')) {
	        _removeAttribute(name, currentNode);
	        continue;
	      }
	      /* Did the hooks approve of the attribute? */
	      if (hookEvent.forceKeepAttr) {
	        continue;
	      }
	      /* Did the hooks approve of the attribute? */
	      if (!hookEvent.keepAttr) {
	        _removeAttribute(name, currentNode);
	        continue;
	      }
	      /* Work around a security issue in jQuery 3.0 */
	      if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(/\/>/i, value)) {
	        _removeAttribute(name, currentNode);
	        continue;
	      }
	      /* Sanitize attribute content to be template-safe */
	      if (SAFE_FOR_TEMPLATES) {
	        arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
	          value = stringReplace(value, expr, ' ');
	        });
	      }
	      /* Is `value` valid for this attribute? */
	      const lcTag = transformCaseFunc(currentNode.nodeName);
	      if (!_isValidAttribute(lcTag, lcName, value)) {
	        _removeAttribute(name, currentNode);
	        continue;
	      }
	      /* Handle attributes that require Trusted Types */
	      if (trustedTypesPolicy && typeof trustedTypes === 'object' && typeof trustedTypes.getAttributeType === 'function') {
	        if (namespaceURI) ; else {
	          switch (trustedTypes.getAttributeType(lcTag, lcName)) {
	            case 'TrustedHTML':
	              {
	                value = trustedTypesPolicy.createHTML(value);
	                break;
	              }
	            case 'TrustedScriptURL':
	              {
	                value = trustedTypesPolicy.createScriptURL(value);
	                break;
	              }
	          }
	        }
	      }
	      /* Handle invalid data-* attribute set by try-catching it */
	      if (value !== initValue) {
	        try {
	          if (namespaceURI) {
	            currentNode.setAttributeNS(namespaceURI, name, value);
	          } else {
	            /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
	            currentNode.setAttribute(name, value);
	          }
	          if (_isClobbered(currentNode)) {
	            _forceRemove(currentNode);
	          } else {
	            arrayPop(DOMPurify.removed);
	          }
	        } catch (_) {
	          _removeAttribute(name, currentNode);
	        }
	      }
	    }
	    /* Execute a hook if present */
	    _executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
	  };
	  /**
	   * _sanitizeShadowDOM
	   *
	   * @param fragment to iterate over recursively
	   */
	  const _sanitizeShadowDOM = function _sanitizeShadowDOM(fragment) {
	    let shadowNode = null;
	    const shadowIterator = _createNodeIterator(fragment);
	    /* Execute a hook if present */
	    _executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
	    while (shadowNode = shadowIterator.nextNode()) {
	      /* Execute a hook if present */
	      _executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
	      /* Sanitize tags and elements */
	      _sanitizeElements(shadowNode);
	      /* Check attributes next */
	      _sanitizeAttributes(shadowNode);
	      /* Deep shadow DOM detected */
	      if (shadowNode.content instanceof DocumentFragment) {
	        _sanitizeShadowDOM(shadowNode.content);
	      }
	    }
	    /* Execute a hook if present */
	    _executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
	  };
	  // eslint-disable-next-line complexity
	  DOMPurify.sanitize = function (dirty) {
	    let cfg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	    let body = null;
	    let importedNode = null;
	    let currentNode = null;
	    let returnNode = null;
	    /* Make sure we have a string to sanitize.
	      DO NOT return early, as this will return the wrong type if
	      the user has requested a DOM object rather than a string */
	    IS_EMPTY_INPUT = !dirty;
	    if (IS_EMPTY_INPUT) {
	      dirty = '<!-->';
	    }
	    /* Stringify, in case dirty is an object */
	    if (typeof dirty !== 'string' && !_isNode(dirty)) {
	      if (typeof dirty.toString === 'function') {
	        dirty = dirty.toString();
	        if (typeof dirty !== 'string') {
	          throw typeErrorCreate('dirty is not a string, aborting');
	        }
	      } else {
	        throw typeErrorCreate('toString is not a function');
	      }
	    }
	    /* Return dirty HTML if DOMPurify cannot run */
	    if (!DOMPurify.isSupported) {
	      return dirty;
	    }
	    /* Assign config vars */
	    if (!SET_CONFIG) {
	      _parseConfig(cfg);
	    }
	    /* Clean up removed elements */
	    DOMPurify.removed = [];
	    /* Check if dirty is correctly typed for IN_PLACE */
	    if (typeof dirty === 'string') {
	      IN_PLACE = false;
	    }
	    if (IN_PLACE) {
	      /* Do some early pre-sanitization to avoid unsafe root nodes */
	      if (dirty.nodeName) {
	        const tagName = transformCaseFunc(dirty.nodeName);
	        if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
	          throw typeErrorCreate('root node is forbidden and cannot be sanitized in-place');
	        }
	      }
	    } else if (dirty instanceof Node) {
	      /* If dirty is a DOM element, append to an empty document to avoid
	         elements being stripped by the parser */
	      body = _initDocument('<!---->');
	      importedNode = body.ownerDocument.importNode(dirty, true);
	      if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === 'BODY') {
	        /* Node is already a body, use as is */
	        body = importedNode;
	      } else if (importedNode.nodeName === 'HTML') {
	        body = importedNode;
	      } else {
	        // eslint-disable-next-line unicorn/prefer-dom-node-append
	        body.appendChild(importedNode);
	      }
	    } else {
	      /* Exit directly if we have nothing to do */
	      if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT &&
	      // eslint-disable-next-line unicorn/prefer-includes
	      dirty.indexOf('<') === -1) {
	        return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(dirty) : dirty;
	      }
	      /* Initialize the document to work on */
	      body = _initDocument(dirty);
	      /* Check we have a DOM node from the data */
	      if (!body) {
	        return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : '';
	      }
	    }
	    /* Remove first element node (ours) if FORCE_BODY is set */
	    if (body && FORCE_BODY) {
	      _forceRemove(body.firstChild);
	    }
	    /* Get node iterator */
	    const nodeIterator = _createNodeIterator(IN_PLACE ? dirty : body);
	    /* Now start iterating over the created document */
	    while (currentNode = nodeIterator.nextNode()) {
	      /* Sanitize tags and elements */
	      _sanitizeElements(currentNode);
	      /* Check attributes next */
	      _sanitizeAttributes(currentNode);
	      /* Shadow DOM detected, sanitize it */
	      if (currentNode.content instanceof DocumentFragment) {
	        _sanitizeShadowDOM(currentNode.content);
	      }
	    }
	    /* If we sanitized `dirty` in-place, return it. */
	    if (IN_PLACE) {
	      return dirty;
	    }
	    /* Return sanitized string or DOM */
	    if (RETURN_DOM) {
	      if (RETURN_DOM_FRAGMENT) {
	        returnNode = createDocumentFragment.call(body.ownerDocument);
	        while (body.firstChild) {
	          // eslint-disable-next-line unicorn/prefer-dom-node-append
	          returnNode.appendChild(body.firstChild);
	        }
	      } else {
	        returnNode = body;
	      }
	      if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) {
	        /*
	          AdoptNode() is not used because internal state is not reset
	          (e.g. the past names map of a HTMLFormElement), this is safe
	          in theory but we would rather not risk another attack vector.
	          The state that is cloned by importNode() is explicitly defined
	          by the specs.
	        */
	        returnNode = importNode.call(originalDocument, returnNode, true);
	      }
	      return returnNode;
	    }
	    let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
	    /* Serialize doctype if allowed */
	    if (WHOLE_DOCUMENT && ALLOWED_TAGS['!doctype'] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) {
	      serializedHTML = '<!DOCTYPE ' + body.ownerDocument.doctype.name + '>\n' + serializedHTML;
	    }
	    /* Sanitize final string template-safe */
	    if (SAFE_FOR_TEMPLATES) {
	      arrayForEach([MUSTACHE_EXPR, ERB_EXPR, TMPLIT_EXPR], expr => {
	        serializedHTML = stringReplace(serializedHTML, expr, ' ');
	      });
	    }
	    return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
	  };
	  DOMPurify.setConfig = function () {
	    let cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    _parseConfig(cfg);
	    SET_CONFIG = true;
	  };
	  DOMPurify.clearConfig = function () {
	    CONFIG = null;
	    SET_CONFIG = false;
	  };
	  DOMPurify.isValidAttribute = function (tag, attr, value) {
	    /* Initialize shared config vars if necessary. */
	    if (!CONFIG) {
	      _parseConfig({});
	    }
	    const lcTag = transformCaseFunc(tag);
	    const lcName = transformCaseFunc(attr);
	    return _isValidAttribute(lcTag, lcName, value);
	  };
	  DOMPurify.addHook = function (entryPoint, hookFunction) {
	    if (typeof hookFunction !== 'function') {
	      return;
	    }
	    arrayPush(hooks[entryPoint], hookFunction);
	  };
	  DOMPurify.removeHook = function (entryPoint, hookFunction) {
	    if (hookFunction !== undefined) {
	      const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
	      return index === -1 ? undefined : arraySplice(hooks[entryPoint], index, 1)[0];
	    }
	    return arrayPop(hooks[entryPoint]);
	  };
	  DOMPurify.removeHooks = function (entryPoint) {
	    hooks[entryPoint] = [];
	  };
	  DOMPurify.removeAllHooks = function () {
	    hooks = _createHooksMap();
	  };
	  return DOMPurify;
	}
	var purify = createDOMPurify();

	purify_cjs = purify;
	
	return purify_cjs;
}

var browser;
var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser;
	hasRequiredBrowser = 1;
	browser = self.DOMPurify || (self.DOMPurify = requirePurify_cjs().default || requirePurify_cjs());
	return browser;
}

var browserExports = requireBrowser();
const DOMPurify = /*@__PURE__*/getDefaultExportFromCjs(browserExports);

/**
 * marked v16.4.2 - a markdown parser
 * Copyright (c) 2018-2025, MarkedJS. (MIT License)
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT License)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */

function L(){return {async:false,breaks:false,extensions:null,gfm:true,hooks:null,pedantic:false,renderer:null,silent:false,tokenizer:null,walkTokens:null}}var T=L();function G(l){T=l;}var E={exec:()=>null};function d(l,e=""){let t=typeof l=="string"?l:l.source,n={replace:(r,i)=>{let s=typeof i=="string"?i:i.source;return s=s.replace(m.caret,"$1"),t=t.replace(r,s),n},getRegex:()=>new RegExp(t,e)};return n}var be=(()=>{try{return !!new RegExp("(?<=1)(?<!1)")}catch{return  false}})(),m={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] /,listReplaceTask:/^\[[ xX]\] +/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:l=>new RegExp(`^( {0,3}${l})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}#`),htmlBeginRegex:l=>new RegExp(`^ {0,${Math.min(3,l-1)}}<(?:[a-z].*>|!--)`,"i")},Re=/^(?:[ \t]*(?:\n|$))+/,Te=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Oe=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,I=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,we=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,F=/(?:[*+-]|\d{1,9}[.)])/,ie=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,oe=d(ie).replace(/bull/g,F).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),ye=d(ie).replace(/bull/g,F).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),j=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,Pe=/^[^\n]+/,Q=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,Se=d(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",Q).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),$e=d(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,F).getRegex(),v="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",U=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,_e=d("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",U).replace("tag",v).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),ae=d(j).replace("hr",I).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex(),Le=d(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",ae).getRegex(),K={blockquote:Le,code:Te,def:Se,fences:Oe,heading:we,hr:I,html:_e,lheading:oe,list:$e,newline:Re,paragraph:ae,table:E,text:Pe},re=d("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",I).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex(),Me={...K,lheading:ye,table:re,paragraph:d(j).replace("hr",I).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",re).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",v).getRegex()},ze={...K,html:d(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",U).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:E,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:d(j).replace("hr",I).replace("heading",` *#{1,6} *[^
]`).replace("lheading",oe).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},Ae=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,Ee=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,le=/^( {2,}|\\)\n(?!\s*$)/,Ie=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,D=/[\p{P}\p{S}]/u,W=/[\s\p{P}\p{S}]/u,ue=/[^\s\p{P}\p{S}]/u,Ce=d(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,W).getRegex(),pe=/(?!~)[\p{P}\p{S}]/u,Be=/(?!~)[\s\p{P}\p{S}]/u,qe=/(?:[^\s\p{P}\p{S}]|~)/u,ve=d(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",be?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),ce=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,De=d(ce,"u").replace(/punct/g,D).getRegex(),He=d(ce,"u").replace(/punct/g,pe).getRegex(),he="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",Ze=d(he,"gu").replace(/notPunctSpace/g,ue).replace(/punctSpace/g,W).replace(/punct/g,D).getRegex(),Ge=d(he,"gu").replace(/notPunctSpace/g,qe).replace(/punctSpace/g,Be).replace(/punct/g,pe).getRegex(),Ne=d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,ue).replace(/punctSpace/g,W).replace(/punct/g,D).getRegex(),Fe=d(/\\(punct)/,"gu").replace(/punct/g,D).getRegex(),je=d(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),Qe=d(U).replace("(?:-->|$)","-->").getRegex(),Ue=d("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",Qe).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),q=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,Ke=d(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",q).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),de=d(/^!?\[(label)\]\[(ref)\]/).replace("label",q).replace("ref",Q).getRegex(),ke=d(/^!?\[(ref)\](?:\[\])?/).replace("ref",Q).getRegex(),We=d("reflink|nolink(?!\\()","g").replace("reflink",de).replace("nolink",ke).getRegex(),se=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,X={_backpedal:E,anyPunctuation:Fe,autolink:je,blockSkip:ve,br:le,code:Ee,del:E,emStrongLDelim:De,emStrongRDelimAst:Ze,emStrongRDelimUnd:Ne,escape:Ae,link:Ke,nolink:ke,punctuation:Ce,reflink:de,reflinkSearch:We,tag:Ue,text:Ie,url:E},Xe={...X,link:d(/^!?\[(label)\]\((.*?)\)/).replace("label",q).getRegex(),reflink:d(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",q).getRegex()},N={...X,emStrongRDelimAst:Ge,emStrongLDelim:He,url:d(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",se).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:d(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",se).getRegex()},Je={...N,br:d(le).replace("{2,}","*").getRegex(),text:d(N.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},C={normal:K,gfm:Me,pedantic:ze},M={normal:X,gfm:N,breaks:Je,pedantic:Xe};var Ve={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},ge=l=>Ve[l];function w(l,e){if(e){if(m.escapeTest.test(l))return l.replace(m.escapeReplace,ge)}else if(m.escapeTestNoEncode.test(l))return l.replace(m.escapeReplaceNoEncode,ge);return l}function J(l){try{l=encodeURI(l).replace(m.percentDecode,"%");}catch{return null}return l}function V(l,e){let t=l.replace(m.findPipe,(i,s,a)=>{let o=false,p=s;for(;--p>=0&&a[p]==="\\";)o=!o;return o?"|":" |"}),n=t.split(m.splitPipe),r=0;if(n[0].trim()||n.shift(),n.length>0&&!n.at(-1)?.trim()&&n.pop(),e)if(n.length>e)n.splice(e);else for(;n.length<e;)n.push("");for(;r<n.length;r++)n[r]=n[r].trim().replace(m.slashPipe,"|");return n}function z(l,e,t){let n=l.length;if(n===0)return "";let r=0;for(;r<n;){let i=l.charAt(n-r-1);if(i===e&&true)r++;else break}return l.slice(0,n-r)}function fe(l,e){if(l.indexOf(e[1])===-1)return  -1;let t=0;for(let n=0;n<l.length;n++)if(l[n]==="\\")n++;else if(l[n]===e[0])t++;else if(l[n]===e[1]&&(t--,t<0))return n;return t>0?-2:-1}function me(l,e,t,n,r){let i=e.href,s=e.title||null,a=l[1].replace(r.other.outputLinkReplace,"$1");n.state.inLink=true;let o={type:l[0].charAt(0)==="!"?"image":"link",raw:t,href:i,title:s,text:a,tokens:n.inlineTokens(a)};return n.state.inLink=false,o}function Ye(l,e,t){let n=l.match(t.other.indentCodeCompensation);if(n===null)return e;let r=n[1];return e.split(`
`).map(i=>{let s=i.match(t.other.beginningSpace);if(s===null)return i;let[a]=s;return a.length>=r.length?i.slice(r.length):i}).join(`
`)}var y=class{options;rules;lexer;constructor(e){this.options=e||T;}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return {type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let n=t[0].replace(this.rules.other.codeRemoveIndent,"");return {type:"code",raw:t[0],codeBlockStyle:"indented",text:this.options.pedantic?n:z(n,`
`)}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let n=t[0],r=Ye(n,t[3]||"",this.rules);return {type:"code",raw:n,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:r}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let n=t[2].trim();if(this.rules.other.endingHash.test(n)){let r=z(n,"#");(this.options.pedantic||!r||this.rules.other.endingSpaceChar.test(r))&&(n=r.trim());}return {type:"heading",raw:t[0],depth:t[1].length,text:n,tokens:this.lexer.inline(n)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return {type:"hr",raw:z(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let n=z(t[0],`
`).split(`
`),r="",i="",s=[];for(;n.length>0;){let a=false,o=[],p;for(p=0;p<n.length;p++)if(this.rules.other.blockquoteStart.test(n[p]))o.push(n[p]),a=true;else if(!a)o.push(n[p]);else break;n=n.slice(p);let u=o.join(`
`),c=u.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");r=r?`${r}
${u}`:u,i=i?`${i}
${c}`:c;let g=this.lexer.state.top;if(this.lexer.state.top=true,this.lexer.blockTokens(c,s,true),this.lexer.state.top=g,n.length===0)break;let h=s.at(-1);if(h?.type==="code")break;if(h?.type==="blockquote"){let R=h,f=R.raw+`
`+n.join(`
`),O=this.blockquote(f);s[s.length-1]=O,r=r.substring(0,r.length-R.raw.length)+O.raw,i=i.substring(0,i.length-R.text.length)+O.text;break}else if(h?.type==="list"){let R=h,f=R.raw+`
`+n.join(`
`),O=this.list(f);s[s.length-1]=O,r=r.substring(0,r.length-h.raw.length)+O.raw,i=i.substring(0,i.length-R.raw.length)+O.raw,n=f.substring(s.at(-1).raw.length).split(`
`);continue}}return {type:"blockquote",raw:r,tokens:s,text:i}}}list(e){let t=this.rules.block.list.exec(e);if(t){let n=t[1].trim(),r=n.length>1,i={type:"list",raw:"",ordered:r,start:r?+n.slice(0,-1):"",loose:false,items:[]};n=r?`\\d{1,9}\\${n.slice(-1)}`:`\\${n}`,this.options.pedantic&&(n=r?n:"[*+-]");let s=this.rules.other.listItemRegex(n),a=false;for(;e;){let p=false,u="",c="";if(!(t=s.exec(e))||this.rules.block.hr.test(e))break;u=t[0],e=e.substring(u.length);let g=t[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,H=>" ".repeat(3*H.length)),h=e.split(`
`,1)[0],R=!g.trim(),f=0;if(this.options.pedantic?(f=2,c=g.trimStart()):R?f=t[1].length+1:(f=t[2].search(this.rules.other.nonSpaceChar),f=f>4?1:f,c=g.slice(f),f+=t[1].length),R&&this.rules.other.blankLine.test(h)&&(u+=h+`
`,e=e.substring(h.length+1),p=true),!p){let H=this.rules.other.nextBulletRegex(f),ee=this.rules.other.hrRegex(f),te=this.rules.other.fencesBeginRegex(f),ne=this.rules.other.headingBeginRegex(f),xe=this.rules.other.htmlBeginRegex(f);for(;e;){let Z=e.split(`
`,1)[0],A;if(h=Z,this.options.pedantic?(h=h.replace(this.rules.other.listReplaceNesting,"  "),A=h):A=h.replace(this.rules.other.tabCharGlobal,"    "),te.test(h)||ne.test(h)||xe.test(h)||H.test(h)||ee.test(h))break;if(A.search(this.rules.other.nonSpaceChar)>=f||!h.trim())c+=`
`+A.slice(f);else {if(R||g.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||te.test(g)||ne.test(g)||ee.test(g))break;c+=`
`+h;}!R&&!h.trim()&&(R=true),u+=Z+`
`,e=e.substring(Z.length+1),g=A.slice(f);}}i.loose||(a?i.loose=true:this.rules.other.doubleBlankLine.test(u)&&(a=true));let O=null,Y;this.options.gfm&&(O=this.rules.other.listIsTask.exec(c),O&&(Y=O[0]!=="[ ] ",c=c.replace(this.rules.other.listReplaceTask,""))),i.items.push({type:"list_item",raw:u,task:!!O,checked:Y,loose:false,text:c,tokens:[]}),i.raw+=u;}let o=i.items.at(-1);if(o)o.raw=o.raw.trimEnd(),o.text=o.text.trimEnd();else return;i.raw=i.raw.trimEnd();for(let p=0;p<i.items.length;p++)if(this.lexer.state.top=false,i.items[p].tokens=this.lexer.blockTokens(i.items[p].text,[]),!i.loose){let u=i.items[p].tokens.filter(g=>g.type==="space"),c=u.length>0&&u.some(g=>this.rules.other.anyLine.test(g.raw));i.loose=c;}if(i.loose)for(let p=0;p<i.items.length;p++)i.items[p].loose=true;return i}}html(e){let t=this.rules.block.html.exec(e);if(t)return {type:"html",block:true,raw:t[0],pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:t[0]}}def(e){let t=this.rules.block.def.exec(e);if(t){let n=t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),r=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",i=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return {type:"def",tag:n,raw:t[0],href:r,title:i}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let n=V(t[1]),r=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),i=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],s={type:"table",raw:t[0],header:[],align:[],rows:[]};if(n.length===r.length){for(let a of r)this.rules.other.tableAlignRight.test(a)?s.align.push("right"):this.rules.other.tableAlignCenter.test(a)?s.align.push("center"):this.rules.other.tableAlignLeft.test(a)?s.align.push("left"):s.align.push(null);for(let a=0;a<n.length;a++)s.header.push({text:n[a],tokens:this.lexer.inline(n[a]),header:true,align:s.align[a]});for(let a of i)s.rows.push(V(a,s.header.length).map((o,p)=>({text:o,tokens:this.lexer.inline(o),header:false,align:s.align[p]})));return s}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t)return {type:"heading",raw:t[0],depth:t[2].charAt(0)==="="?1:2,text:t[1],tokens:this.lexer.inline(t[1])}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let n=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return {type:"paragraph",raw:t[0],text:n,tokens:this.lexer.inline(n)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return {type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return {type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return !this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=true:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=false),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=true:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=false),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:false,text:t[0]}}link(e){let t=this.rules.inline.link.exec(e);if(t){let n=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(n)){if(!this.rules.other.endAngleBracket.test(n))return;let s=z(n.slice(0,-1),"\\");if((n.length-s.length)%2===0)return}else {let s=fe(t[2],"()");if(s===-2)return;if(s>-1){let o=(t[0].indexOf("!")===0?5:4)+t[1].length+s;t[2]=t[2].substring(0,s),t[0]=t[0].substring(0,o).trim(),t[3]="";}}let r=t[2],i="";if(this.options.pedantic){let s=this.rules.other.pedanticHrefTitle.exec(r);s&&(r=s[1],i=s[3]);}else i=t[3]?t[3].slice(1,-1):"";return r=r.trim(),this.rules.other.startAngleBracket.test(r)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(n)?r=r.slice(1):r=r.slice(1,-1)),me(t,{href:r&&r.replace(this.rules.inline.anyPunctuation,"$1"),title:i&&i.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let n;if((n=this.rules.inline.reflink.exec(e))||(n=this.rules.inline.nolink.exec(e))){let r=(n[2]||n[1]).replace(this.rules.other.multipleSpaceGlobal," "),i=t[r.toLowerCase()];if(!i){let s=n[0].charAt(0);return {type:"text",raw:s,text:s}}return me(n,i,n[0],this.lexer,this.rules)}}emStrong(e,t,n=""){let r=this.rules.inline.emStrongLDelim.exec(e);if(!r||r[3]&&n.match(this.rules.other.unicodeAlphaNumeric))return;if(!(r[1]||r[2]||"")||!n||this.rules.inline.punctuation.exec(n)){let s=[...r[0]].length-1,a,o,p=s,u=0,c=r[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(c.lastIndex=0,t=t.slice(-1*e.length+s);(r=c.exec(t))!=null;){if(a=r[1]||r[2]||r[3]||r[4]||r[5]||r[6],!a)continue;if(o=[...a].length,r[3]||r[4]){p+=o;continue}else if((r[5]||r[6])&&s%3&&!((s+o)%3)){u+=o;continue}if(p-=o,p>0)continue;o=Math.min(o,o+p+u);let g=[...r[0]][0].length,h=e.slice(0,s+r.index+g+o);if(Math.min(s,o)%2){let f=h.slice(1,-1);return {type:"em",raw:h,text:f,tokens:this.lexer.inlineTokens(f)}}let R=h.slice(2,-2);return {type:"strong",raw:h,text:R,tokens:this.lexer.inlineTokens(R)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let n=t[2].replace(this.rules.other.newLineCharGlobal," "),r=this.rules.other.nonSpaceChar.test(n),i=this.rules.other.startingSpaceChar.test(n)&&this.rules.other.endingSpaceChar.test(n);return r&&i&&(n=n.substring(1,n.length-1)),{type:"codespan",raw:t[0],text:n}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return {type:"br",raw:t[0]}}del(e){let t=this.rules.inline.del.exec(e);if(t)return {type:"del",raw:t[0],text:t[2],tokens:this.lexer.inlineTokens(t[2])}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let n,r;return t[2]==="@"?(n=t[1],r="mailto:"+n):(n=t[1],r=n),{type:"link",raw:t[0],text:n,href:r,tokens:[{type:"text",raw:n,text:n}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let n,r;if(t[2]==="@")n=t[0],r="mailto:"+n;else {let i;do i=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??"";while(i!==t[0]);n=t[0],t[1]==="www."?r="http://"+t[0]:r=t[0];}return {type:"link",raw:t[0],text:n,href:r,tokens:[{type:"text",raw:n,text:n}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let n=this.lexer.state.inRawBlock;return {type:"text",raw:t[0],text:t[0],escaped:n}}}};var x=class l{tokens;options;state;tokenizer;inlineQueue;constructor(e){this.tokens=[],this.tokens.links=Object.create(null),this.options=e||T,this.options.tokenizer=this.options.tokenizer||new y,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:false,inRawBlock:false,top:true};let t={other:m,block:C.normal,inline:M.normal};this.options.pedantic?(t.block=C.pedantic,t.inline=M.pedantic):this.options.gfm&&(t.block=C.gfm,this.options.breaks?t.inline=M.breaks:t.inline=M.gfm),this.tokenizer.rules=t;}static get rules(){return {block:C,inline:M}}static lex(e,t){return new l(t).lex(e)}static lexInline(e,t){return new l(t).inlineTokens(e)}lex(e){e=e.replace(m.carriageReturn,`
`),this.blockTokens(e,this.tokens);for(let t=0;t<this.inlineQueue.length;t++){let n=this.inlineQueue[t];this.inlineTokens(n.src,n.tokens);}return this.inlineQueue=[],this.tokens}blockTokens(e,t=[],n=false){for(this.options.pedantic&&(e=e.replace(m.tabCharGlobal,"    ").replace(m.spaceLine,""));e;){let r;if(this.options.extensions?.block?.some(s=>(r=s.call({lexer:this},e,t))?(e=e.substring(r.raw.length),t.push(r),true):false))continue;if(r=this.tokenizer.space(e)){e=e.substring(r.raw.length);let s=t.at(-1);r.raw.length===1&&s!==void 0?s.raw+=`
`:t.push(r);continue}if(r=this.tokenizer.code(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="paragraph"||s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.at(-1).src=s.text):t.push(r);continue}if(r=this.tokenizer.fences(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.heading(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.hr(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.blockquote(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.list(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.html(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.def(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="paragraph"||s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.raw,this.inlineQueue.at(-1).src=s.text):this.tokens.links[r.tag]||(this.tokens.links[r.tag]={href:r.href,title:r.title},t.push(r));continue}if(r=this.tokenizer.table(e)){e=e.substring(r.raw.length),t.push(r);continue}if(r=this.tokenizer.lheading(e)){e=e.substring(r.raw.length),t.push(r);continue}let i=e;if(this.options.extensions?.startBlock){let s=1/0,a=e.slice(1),o;this.options.extensions.startBlock.forEach(p=>{o=p.call({lexer:this},a),typeof o=="number"&&o>=0&&(s=Math.min(s,o));}),s<1/0&&s>=0&&(i=e.substring(0,s+1));}if(this.state.top&&(r=this.tokenizer.paragraph(i))){let s=t.at(-1);n&&s?.type==="paragraph"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=s.text):t.push(r),n=i.length!==e.length,e=e.substring(r.raw.length);continue}if(r=this.tokenizer.text(e)){e=e.substring(r.raw.length);let s=t.at(-1);s?.type==="text"?(s.raw+=(s.raw.endsWith(`
`)?"":`
`)+r.raw,s.text+=`
`+r.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=s.text):t.push(r);continue}if(e){let s="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(s);break}else throw new Error(s)}}return this.state.top=true,t}inline(e,t=[]){return this.inlineQueue.push({src:e,tokens:t}),t}inlineTokens(e,t=[]){let n=e,r=null;if(this.tokens.links){let o=Object.keys(this.tokens.links);if(o.length>0)for(;(r=this.tokenizer.rules.inline.reflinkSearch.exec(n))!=null;)o.includes(r[0].slice(r[0].lastIndexOf("[")+1,-1))&&(n=n.slice(0,r.index)+"["+"a".repeat(r[0].length-2)+"]"+n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));}for(;(r=this.tokenizer.rules.inline.anyPunctuation.exec(n))!=null;)n=n.slice(0,r.index)+"++"+n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let i;for(;(r=this.tokenizer.rules.inline.blockSkip.exec(n))!=null;)i=r[2]?r[2].length:0,n=n.slice(0,r.index+i)+"["+"a".repeat(r[0].length-i-2)+"]"+n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);n=this.options.hooks?.emStrongMask?.call({lexer:this},n)??n;let s=false,a="";for(;e;){s||(a=""),s=false;let o;if(this.options.extensions?.inline?.some(u=>(o=u.call({lexer:this},e,t))?(e=e.substring(o.raw.length),t.push(o),true):false))continue;if(o=this.tokenizer.escape(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.tag(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.link(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(o.raw.length);let u=t.at(-1);o.type==="text"&&u?.type==="text"?(u.raw+=o.raw,u.text+=o.text):t.push(o);continue}if(o=this.tokenizer.emStrong(e,n,a)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.codespan(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.br(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.del(e)){e=e.substring(o.raw.length),t.push(o);continue}if(o=this.tokenizer.autolink(e)){e=e.substring(o.raw.length),t.push(o);continue}if(!this.state.inLink&&(o=this.tokenizer.url(e))){e=e.substring(o.raw.length),t.push(o);continue}let p=e;if(this.options.extensions?.startInline){let u=1/0,c=e.slice(1),g;this.options.extensions.startInline.forEach(h=>{g=h.call({lexer:this},c),typeof g=="number"&&g>=0&&(u=Math.min(u,g));}),u<1/0&&u>=0&&(p=e.substring(0,u+1));}if(o=this.tokenizer.inlineText(p)){e=e.substring(o.raw.length),o.raw.slice(-1)!=="_"&&(a=o.raw.slice(-1)),s=true;let u=t.at(-1);u?.type==="text"?(u.raw+=o.raw,u.text+=o.text):t.push(o);continue}if(e){let u="Infinite loop on byte: "+e.charCodeAt(0);if(this.options.silent){console.error(u);break}else throw new Error(u)}}return t}};var P=class{options;parser;constructor(e){this.options=e||T;}space(e){return ""}code({text:e,lang:t,escaped:n}){let r=(t||"").match(m.notSpaceStart)?.[0],i=e.replace(m.endingNewline,"")+`
`;return r?'<pre><code class="language-'+w(r)+'">'+(n?i:w(i,true))+`</code></pre>
`:"<pre><code>"+(n?i:w(i,true))+`</code></pre>
`}blockquote({tokens:e}){return `<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return ""}heading({tokens:e,depth:t}){return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return `<hr>
`}list(e){let t=e.ordered,n=e.start,r="";for(let a=0;a<e.items.length;a++){let o=e.items[a];r+=this.listitem(o);}let i=t?"ol":"ul",s=t&&n!==1?' start="'+n+'"':"";return "<"+i+s+`>
`+r+"</"+i+`>
`}listitem(e){let t="";if(e.task){let n=this.checkbox({checked:!!e.checked});e.loose?e.tokens[0]?.type==="paragraph"?(e.tokens[0].text=n+" "+e.tokens[0].text,e.tokens[0].tokens&&e.tokens[0].tokens.length>0&&e.tokens[0].tokens[0].type==="text"&&(e.tokens[0].tokens[0].text=n+" "+w(e.tokens[0].tokens[0].text),e.tokens[0].tokens[0].escaped=true)):e.tokens.unshift({type:"text",raw:n+" ",text:n+" ",escaped:true}):t+=n+" ";}return t+=this.parser.parse(e.tokens,!!e.loose),`<li>${t}</li>
`}checkbox({checked:e}){return "<input "+(e?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph({tokens:e}){return `<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",n="";for(let i=0;i<e.header.length;i++)n+=this.tablecell(e.header[i]);t+=this.tablerow({text:n});let r="";for(let i=0;i<e.rows.length;i++){let s=e.rows[i];n="";for(let a=0;a<s.length;a++)n+=this.tablecell(s[a]);r+=this.tablerow({text:n});}return r&&(r=`<tbody>${r}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+r+`</table>
`}tablerow({text:e}){return `<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),n=e.header?"th":"td";return (e.align?`<${n} align="${e.align}">`:`<${n}>`)+t+`</${n}>
`}strong({tokens:e}){return `<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return `<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return `<code>${w(e,true)}</code>`}br(e){return "<br>"}del({tokens:e}){return `<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,tokens:n}){let r=this.parser.parseInline(n),i=J(e);if(i===null)return r;e=i;let s='<a href="'+e+'"';return t&&(s+=' title="'+w(t)+'"'),s+=">"+r+"</a>",s}image({href:e,title:t,text:n,tokens:r}){r&&(n=this.parser.parseInline(r,this.parser.textRenderer));let i=J(e);if(i===null)return w(n);e=i;let s=`<img src="${e}" alt="${n}"`;return t&&(s+=` title="${w(t)}"`),s+=">",s}text(e){return "tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:w(e.text)}};var $=class{strong({text:e}){return e}em({text:e}){return e}codespan({text:e}){return e}del({text:e}){return e}html({text:e}){return e}text({text:e}){return e}link({text:e}){return ""+e}image({text:e}){return ""+e}br(){return ""}};var b=class l{options;renderer;textRenderer;constructor(e){this.options=e||T,this.options.renderer=this.options.renderer||new P,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new $;}static parse(e,t){return new l(t).parse(e)}static parseInline(e,t){return new l(t).parseInline(e)}parse(e,t=true){let n="";for(let r=0;r<e.length;r++){let i=e[r];if(this.options.extensions?.renderers?.[i.type]){let a=i,o=this.options.extensions.renderers[a.type].call({parser:this},a);if(o!==false||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(a.type)){n+=o||"";continue}}let s=i;switch(s.type){case "space":{n+=this.renderer.space(s);continue}case "hr":{n+=this.renderer.hr(s);continue}case "heading":{n+=this.renderer.heading(s);continue}case "code":{n+=this.renderer.code(s);continue}case "table":{n+=this.renderer.table(s);continue}case "blockquote":{n+=this.renderer.blockquote(s);continue}case "list":{n+=this.renderer.list(s);continue}case "html":{n+=this.renderer.html(s);continue}case "def":{n+=this.renderer.def(s);continue}case "paragraph":{n+=this.renderer.paragraph(s);continue}case "text":{let a=s,o=this.renderer.text(a);for(;r+1<e.length&&e[r+1].type==="text";)a=e[++r],o+=`
`+this.renderer.text(a);t?n+=this.renderer.paragraph({type:"paragraph",raw:o,text:o,tokens:[{type:"text",raw:o,text:o,escaped:true}]}):n+=o;continue}default:{let a='Token with "'+s.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return n}parseInline(e,t=this.renderer){let n="";for(let r=0;r<e.length;r++){let i=e[r];if(this.options.extensions?.renderers?.[i.type]){let a=this.options.extensions.renderers[i.type].call({parser:this},i);if(a!==false||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(i.type)){n+=a||"";continue}}let s=i;switch(s.type){case "escape":{n+=t.text(s);break}case "html":{n+=t.html(s);break}case "link":{n+=t.link(s);break}case "image":{n+=t.image(s);break}case "strong":{n+=t.strong(s);break}case "em":{n+=t.em(s);break}case "codespan":{n+=t.codespan(s);break}case "br":{n+=t.br(s);break}case "del":{n+=t.del(s);break}case "text":{n+=t.text(s);break}default:{let a='Token with "'+s.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return n}};var S=class{options;block;constructor(e){this.options=e||T;}static passThroughHooks=new Set(["preprocess","postprocess","processAllTokens","emStrongMask"]);static passThroughHooksRespectAsync=new Set(["preprocess","postprocess","processAllTokens"]);preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(){return this.block?x.lex:x.lexInline}provideParser(){return this.block?b.parse:b.parseInline}};var B=class{defaults=L();options=this.setOptions;parse=this.parseMarkdown(true);parseInline=this.parseMarkdown(false);Parser=b;Renderer=P;TextRenderer=$;Lexer=x;Tokenizer=y;Hooks=S;constructor(...e){this.use(...e);}walkTokens(e,t){let n=[];for(let r of e)switch(n=n.concat(t.call(this,r)),r.type){case "table":{let i=r;for(let s of i.header)n=n.concat(this.walkTokens(s.tokens,t));for(let s of i.rows)for(let a of s)n=n.concat(this.walkTokens(a.tokens,t));break}case "list":{let i=r;n=n.concat(this.walkTokens(i.items,t));break}default:{let i=r;this.defaults.extensions?.childTokens?.[i.type]?this.defaults.extensions.childTokens[i.type].forEach(s=>{let a=i[s].flat(1/0);n=n.concat(this.walkTokens(a,t));}):i.tokens&&(n=n.concat(this.walkTokens(i.tokens,t)));}}return n}use(...e){let t=this.defaults.extensions||{renderers:{},childTokens:{}};return e.forEach(n=>{let r={...n};if(r.async=this.defaults.async||r.async||false,n.extensions&&(n.extensions.forEach(i=>{if(!i.name)throw new Error("extension name required");if("renderer"in i){let s=t.renderers[i.name];s?t.renderers[i.name]=function(...a){let o=i.renderer.apply(this,a);return o===false&&(o=s.apply(this,a)),o}:t.renderers[i.name]=i.renderer;}if("tokenizer"in i){if(!i.level||i.level!=="block"&&i.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let s=t[i.level];s?s.unshift(i.tokenizer):t[i.level]=[i.tokenizer],i.start&&(i.level==="block"?t.startBlock?t.startBlock.push(i.start):t.startBlock=[i.start]:i.level==="inline"&&(t.startInline?t.startInline.push(i.start):t.startInline=[i.start]));}"childTokens"in i&&i.childTokens&&(t.childTokens[i.name]=i.childTokens);}),r.extensions=t),n.renderer){let i=this.defaults.renderer||new P(this.defaults);for(let s in n.renderer){if(!(s in i))throw new Error(`renderer '${s}' does not exist`);if(["options","parser"].includes(s))continue;let a=s,o=n.renderer[a],p=i[a];i[a]=(...u)=>{let c=o.apply(i,u);return c===false&&(c=p.apply(i,u)),c||""};}r.renderer=i;}if(n.tokenizer){let i=this.defaults.tokenizer||new y(this.defaults);for(let s in n.tokenizer){if(!(s in i))throw new Error(`tokenizer '${s}' does not exist`);if(["options","rules","lexer"].includes(s))continue;let a=s,o=n.tokenizer[a],p=i[a];i[a]=(...u)=>{let c=o.apply(i,u);return c===false&&(c=p.apply(i,u)),c};}r.tokenizer=i;}if(n.hooks){let i=this.defaults.hooks||new S;for(let s in n.hooks){if(!(s in i))throw new Error(`hook '${s}' does not exist`);if(["options","block"].includes(s))continue;let a=s,o=n.hooks[a],p=i[a];S.passThroughHooks.has(s)?i[a]=u=>{if(this.defaults.async&&S.passThroughHooksRespectAsync.has(s))return (async()=>{let g=await o.call(i,u);return p.call(i,g)})();let c=o.call(i,u);return p.call(i,c)}:i[a]=(...u)=>{if(this.defaults.async)return (async()=>{let g=await o.apply(i,u);return g===false&&(g=await p.apply(i,u)),g})();let c=o.apply(i,u);return c===false&&(c=p.apply(i,u)),c};}r.hooks=i;}if(n.walkTokens){let i=this.defaults.walkTokens,s=n.walkTokens;r.walkTokens=function(a){let o=[];return o.push(s.call(this,a)),i&&(o=o.concat(i.call(this,a))),o};}this.defaults={...this.defaults,...r};}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return x.lex(e,t??this.defaults)}parser(e,t){return b.parse(e,t??this.defaults)}parseMarkdown(e){return (n,r)=>{let i={...r},s={...this.defaults,...i},a=this.onError(!!s.silent,!!s.async);if(this.defaults.async===true&&i.async===false)return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof n>"u"||n===null)return a(new Error("marked(): input parameter is undefined or null"));if(typeof n!="string")return a(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(n)+", string expected"));if(s.hooks&&(s.hooks.options=s,s.hooks.block=e),s.async)return (async()=>{let o=s.hooks?await s.hooks.preprocess(n):n,u=await(s.hooks?await s.hooks.provideLexer():e?x.lex:x.lexInline)(o,s),c=s.hooks?await s.hooks.processAllTokens(u):u;s.walkTokens&&await Promise.all(this.walkTokens(c,s.walkTokens));let h=await(s.hooks?await s.hooks.provideParser():e?b.parse:b.parseInline)(c,s);return s.hooks?await s.hooks.postprocess(h):h})().catch(a);try{s.hooks&&(n=s.hooks.preprocess(n));let p=(s.hooks?s.hooks.provideLexer():e?x.lex:x.lexInline)(n,s);s.hooks&&(p=s.hooks.processAllTokens(p)),s.walkTokens&&this.walkTokens(p,s.walkTokens);let c=(s.hooks?s.hooks.provideParser():e?b.parse:b.parseInline)(p,s);return s.hooks&&(c=s.hooks.postprocess(c)),c}catch(o){return a(o)}}}onError(e,t){return n=>{if(n.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let r="<p>An error occurred:</p><pre>"+w(n.message+"",true)+"</pre>";return t?Promise.resolve(r):r}if(t)return Promise.reject(n);throw n}}};var _=new B;function k(l,e){return _.parse(l,e)}k.options=k.setOptions=function(l){return _.setOptions(l),k.defaults=_.defaults,G(k.defaults),k};k.getDefaults=L;k.defaults=T;k.use=function(...l){return _.use(...l),k.defaults=_.defaults,G(k.defaults),k};k.walkTokens=function(l,e){return _.walkTokens(l,e)};k.parseInline=_.parseInline;k.Parser=b;k.parser=b.parse;k.Renderer=P;k.TextRenderer=$;k.Lexer=x;k.lexer=x.lex;k.Tokenizer=y;k.Hooks=S;k.parse=k;k.options;k.setOptions;k.use;k.walkTokens;k.parseInline;b.parse;x.lex;

/* eslint no-constant-condition:0 */
var findEndOfMath = function findEndOfMath(delimiter, text, startIndex) {
  // Adapted from
  // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
  var index = startIndex;
  var braceLevel = 0;
  var delimLength = delimiter.length;

  while (index < text.length) {
    var character = text[index];

    if (braceLevel <= 0 && text.slice(index, index + delimLength) === delimiter) {
      return index;
    } else if (character === "\\") {
      index++;
    } else if (character === "{") {
      braceLevel++;
    } else if (character === "}") {
      braceLevel--;
    }

    index++;
  }

  return -1;
};

var escapeRegex = function escapeRegex(string) {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

var amsRegex = /^\\begin{/;

var splitAtDelimiters = function splitAtDelimiters(text, delimiters) {
  var index;
  var data = [];
  var regexLeft = new RegExp("(" + delimiters.map(x => escapeRegex(x.left)).join("|") + ")");

  while (true) {
    index = text.search(regexLeft);

    if (index === -1) {
      break;
    }

    if (index > 0) {
      data.push({
        type: "text",
        data: text.slice(0, index)
      });
      text = text.slice(index); // now text starts with delimiter
    } // ... so this always succeeds:


    var i = delimiters.findIndex(delim => text.startsWith(delim.left));
    index = findEndOfMath(delimiters[i].right, text, delimiters[i].left.length);

    if (index === -1) {
      break;
    }

    var rawData = text.slice(0, index + delimiters[i].right.length);
    var math = amsRegex.test(rawData) ? rawData : text.slice(delimiters[i].left.length, index);
    data.push({
      type: "math",
      data: math,
      rawData,
      display: delimiters[i].display
    });
    text = text.slice(index + delimiters[i].right.length);
  }

  if (text !== "") {
    data.push({
      type: "text",
      data: text
    });
  }

  return data;
};

/* eslint no-console:0 */
/* Note: optionsCopy is mutated by this method. If it is ever exposed in the
 * API, we should copy it before mutating.
 */

var renderMathInText = function renderMathInText(text, optionsCopy) {
  var data = splitAtDelimiters(text, optionsCopy.delimiters);

  if (data.length === 1 && data[0].type === 'text') {
    // There is no formula in the text.
    // Let's return null which means there is no need to replace
    // the current text node with a new one.
    return null;
  }

  var fragment = document.createDocumentFragment();

  for (var i = 0; i < data.length; i++) {
    if (data[i].type === "text") {
      fragment.appendChild(document.createTextNode(data[i].data));
    } else {
      var span = document.createElement("span");
      var math = data[i].data; // Override any display mode defined in the settings with that
      // defined by the text itself

      optionsCopy.displayMode = data[i].display;

      try {
        if (optionsCopy.preProcess) {
          math = optionsCopy.preProcess(math);
        }

        katex.render(math, span, optionsCopy);
      } catch (e) {
        if (!(e instanceof katex.ParseError)) {
          throw e;
        }

        optionsCopy.errorCallback("KaTeX auto-render: Failed to parse `" + data[i].data + "` with ", e);
        fragment.appendChild(document.createTextNode(data[i].rawData));
        continue;
      }

      fragment.appendChild(span);
    }
  }

  return fragment;
};

var renderElem = function renderElem(elem, optionsCopy) {
  for (var i = 0; i < elem.childNodes.length; i++) {
    var childNode = elem.childNodes[i];

    if (childNode.nodeType === 3) {
      // Text node
      // Concatenate all sibling text nodes.
      // Webkit browsers split very large text nodes into smaller ones,
      // so the delimiters may be split across different nodes.
      var textContentConcat = childNode.textContent;
      var sibling = childNode.nextSibling;
      var nSiblings = 0;

      while (sibling && sibling.nodeType === Node.TEXT_NODE) {
        textContentConcat += sibling.textContent;
        sibling = sibling.nextSibling;
        nSiblings++;
      }

      var frag = renderMathInText(textContentConcat, optionsCopy);

      if (frag) {
        // Remove extra text nodes
        for (var j = 0; j < nSiblings; j++) {
          childNode.nextSibling.remove();
        }

        i += frag.childNodes.length - 1;
        elem.replaceChild(frag, childNode);
      } else {
        // If the concatenated text does not contain math
        // the siblings will not either
        i += nSiblings;
      }
    } else if (childNode.nodeType === 1) {
      (function () {
        // Element node
        var className = ' ' + childNode.className + ' ';
        var shouldRender = optionsCopy.ignoredTags.indexOf(childNode.nodeName.toLowerCase()) === -1 && optionsCopy.ignoredClasses.every(x => className.indexOf(' ' + x + ' ') === -1);

        if (shouldRender) {
          renderElem(childNode, optionsCopy);
        }
      })();
    } // Otherwise, it's something else, and ignore it.

  }
};

var renderMathInElement = function renderMathInElement(elem, options) {
  if (!elem) {
    throw new Error("No element provided to render");
  }

  var optionsCopy = {}; // Object.assign(optionsCopy, option)

  for (var option in options) {
    if (options.hasOwnProperty(option)) {
      optionsCopy[option] = options[option];
    }
  } // default options


  optionsCopy.delimiters = optionsCopy.delimiters || [{
    left: "$$",
    right: "$$",
    display: true
  }, {
    left: "\\(",
    right: "\\)",
    display: false
  }, // LaTeX uses $…$, but it ruins the display of normal `$` in text:
  // {left: "$", right: "$", display: false},
  // $ must come after $$
  // Render AMS environments even if outside $$…$$ delimiters.
  {
    left: "\\begin{equation}",
    right: "\\end{equation}",
    display: true
  }, {
    left: "\\begin{align}",
    right: "\\end{align}",
    display: true
  }, {
    left: "\\begin{alignat}",
    right: "\\end{alignat}",
    display: true
  }, {
    left: "\\begin{gather}",
    right: "\\end{gather}",
    display: true
  }, {
    left: "\\begin{CD}",
    right: "\\end{CD}",
    display: true
  }, {
    left: "\\[",
    right: "\\]",
    display: true
  }];
  optionsCopy.ignoredTags = optionsCopy.ignoredTags || ["script", "noscript", "style", "textarea", "pre", "code", "option"];
  optionsCopy.ignoredClasses = optionsCopy.ignoredClasses || [];
  optionsCopy.errorCallback = optionsCopy.errorCallback || console.error; // Enable sharing of global macros defined via `\gdef` between different
  // math elements within a single call to `renderMathInElement`.

  optionsCopy.macros = optionsCopy.macros || {};
  renderElem(elem, optionsCopy);
};

k?.use?.(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
    output: "mathml",
    strict: false
  }),
  {
    hooks: {
      preprocess: (markdown) => {
        if (/\\(.*\\)|\\[.*\\]/.test(markdown)) {
          const katexNode = document.createElement("div");
          katexNode.innerHTML = markdown;
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
          });
          return katexNode.innerHTML;
        }
        return markdown;
      }
    }
  }
);
const styled = preloadStyle(styles);
class MarkdownView extends HTMLElement {
  static observedAttributes = ["src", "content", "show-actions", "show-title", "title"];
  #view = null;
  #content = "";
  #showActions = false;
  #showTitle = false;
  #title = "Markdown Viewer";
  constructor() {
    super();
    this.createShadowRoot();
  }
  connectedCallback() {
    this.style.setProperty("pointer-events", "auto");
    this.style.setProperty("touch-action", "manipulation");
    this.style.setProperty("user-select", "text");
    const src = this.getAttribute("src");
    const content = this.getAttribute("content");
    if (content) {
      this.setContent(content);
    } else if (src) {
      this.renderMarkdown(src);
    } else {
      this.loadFromCache().then((cached) => {
        if (cached) {
          this.setContent(cached);
        }
      }).catch(console.warn.bind(console));
    }
  }
  /**
   * Set content directly
   */
  async setContent(content) {
    this.#content = content || "";
    await this.writeToCache(this.#content).catch(console.warn.bind(console));
    return this.setHTML(await k.parse((this.#content || "")?.trim?.() || "")).catch(console.warn.bind(console));
  }
  /**
   * Get current content
   */
  getContent() {
    return this.#content;
  }
  /**
   * Set HTML content in the view
   */
  async setHTML(doc = "") {
    const view = this.#view;
    if (view) {
      const html = await doc;
      const sanitized = DOMPurify?.sanitize?.((html || "")?.trim?.() || "") || "";
      view.innerHTML = sanitized || view?.innerHTML || "";
    }
    document.dispatchEvent(new CustomEvent("ext-ready", {}));
  }
  /**
   * Load content from cache (supports both localStorage and OPFS)
   */
  async loadFromCache() {
    try {
      if (navigator?.storage) {
        try {
          const cachedFile = await provide("/user/cache/last.md");
          if (cachedFile) {
            const text = await cachedFile.text?.();
            if (text) return text;
          }
        } catch (error) {
        }
      }
      return localStorage.getItem("$cached-md$");
    } catch (error) {
      console.warn("[MarkdownView] Failed to load from cache:", error);
      return null;
    }
  }
  /**
   * Write content to cache (supports both localStorage and OPFS)
   */
  async writeToCache(content) {
    if (typeof content !== "string") {
      content = await content.text();
    }
    try {
      if (navigator?.storage) {
        try {
          const forWrite = await provide("/user/cache/last.md", true);
          if (forWrite?.write) {
            await forWrite.write(content);
            await forWrite.close?.();
            return;
          }
        } catch (error) {
        }
      }
      localStorage.setItem("$cached-md$", content);
    } catch (error) {
      console.warn("[MarkdownView] Failed to write to cache:", error);
    }
  }
  /**
   * Render markdown from file path, URL, or content
   */
  async renderMarkdown(file) {
    const renderMarkdownText = async (text) => {
      await this.writeToCache(text).catch(console.warn.bind(console));
      return this.setContent(text).catch(console.warn.bind(console));
    };
    if (!file) {
      const cached = await this.loadFromCache();
      if (cached) {
        return this.renderMarkdown(cached).catch(console.warn.bind(console));
      }
      return;
    }
    if (typeof file === "string") {
      const fileStr = file.trim();
      if (URL.canParse(fileStr) || fileStr.startsWith("blob:") || fileStr.startsWith("/user/") || fileStr.startsWith("./") || fileStr.startsWith("../")) {
        try {
          const fetched = await provide(fileStr);
          if (fetched) {
            const text = await fetched.text?.();
            if (text) {
              return renderMarkdownText(text).catch(console.warn.bind(console));
            }
          }
        } catch (error) {
          console.warn("[MarkdownView] Failed to fetch file:", error);
          if (!fileStr.includes("\n") && fileStr.length < 100) {
            return;
          }
        }
      }
      return renderMarkdownText(fileStr).catch(console.warn.bind(console));
    }
    if (file instanceof File || file instanceof Blob || file instanceof Response) {
      try {
        const text = await file.text();
        return renderMarkdownText(text).catch(console.warn.bind(console));
      } catch (error) {
        console.error("[MarkdownView] Error reading file:", error);
      }
    }
  }
  /**
   * Handle attribute changes
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    switch (name) {
      case "src":
        if (newValue) {
          this.renderMarkdown(newValue).catch(console.warn.bind(console));
        }
        break;
      case "content":
        if (newValue) {
          this.setContent(newValue).catch(console.warn.bind(console));
        }
        break;
      case "show-actions":
        this.#showActions = newValue !== null;
        break;
      case "show-title":
        this.#showTitle = newValue !== null;
        break;
      case "title":
        this.#title = newValue || "Markdown Viewer";
        break;
    }
  }
  /**
   * Create shadow root with markdown view
   */
  createShadowRoot() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.append(this.#view = E$1("div.markdown-body", { dataset: { print: "" } })?.element);
    shadowRoot.adoptedStyleSheets.push(styled);
  }
}
customElements.define("md-view", MarkdownView);

export { DOMPurify, MarkdownView, renderMathInElement };
//# sourceMappingURL=Markdown.js.map
