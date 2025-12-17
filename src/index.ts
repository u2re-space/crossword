import frontend from "./frontend/index";

const ensureAppCss = () => {
    // App is built as a JS module; make sure extracted CSS is loaded in production.
    // Skip extension pages: they have their own HTML entrypoints and CSS injection.
    const viteEnv = (import.meta as any)?.env;
    if (viteEnv?.DEV) return;
    if (typeof window === "undefined") return;
    if (window.location.protocol === "chrome-extension:") return;

    const id = "rs-crossword-css";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    // @vite-ignore
    link.href = new URL("./assets/crossword.css", import.meta.url).toString();
    document.head.append(link);
};

//
export default async function bootstrap(mountElement) {
    ensureAppCss();
    frontend?.(mountElement);
}
