/* App Loader */
export default async function loadApp(mountElement) {
    //
    if ('serviceWorker' in navigator) {
        try { await navigator.serviceWorker.register('./src/pwa/sw.ts', { type: 'module', scope: '/' })?.catch?.(console.warn.bind(console)); } catch(e) { console.warn(e); }
    }

    //
    const app = await import("./src/index.mjs")?.catch?.(console.error.bind(console));
    app.default(mountElement);
}

//
loadApp(document.getElementById("app"));
