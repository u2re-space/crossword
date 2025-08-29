/* App Loader */
export default async function loadApp(mountElement) {
    //
    if ('serviceWorker' in navigator) {
        try { await navigator.serviceWorker.register('/src/pwa/sw.mjs'); } catch(e) { console.warn(e); }
    }

    //
    const app = await import("./src/index.mjs");
    app.default(mountElement);
}

//
loadApp(document.getElementById("app"));
