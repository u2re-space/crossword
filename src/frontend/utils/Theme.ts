import { loadSettings } from "@rs-core/config/Settings";
import type { AppSettings } from "@rs-core/config/SettingsTypes";

export const applyTheme = (theme?: string) => {
    const root = document.documentElement;
    const resolvedTheme = theme || "auto";

    // implemented in veela.css
    //root.dataset.scheme = resolvedTheme;
    root.setAttribute("data-scheme", resolvedTheme);

    /* // I'm already implemented in veela.css
    if (resolvedTheme === "dark") {
        root.classList.add("dark", "u-dark");
        root.classList.remove("light", "u-light");
        root.style.colorScheme = "dark";
    } else if (resolvedTheme === "light") {
        root.classList.add("light", "u-light");
        root.classList.remove("dark", "u-dark");
        root.style.colorScheme = "light";
    } else {
        // Auto
        root.classList.remove("dark", "light", "u-dark", "u-light");
        root.style.colorScheme = "light dark";
        // If we need to polyfill or force class for frameworks that expect it
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
           // Maybe set a temporary class if needed, but 'color-scheme' usually handles it for native inputs
        }
    }*/
};

export const initTheme = async () => {
    try {
        const settings = await loadSettings();
        applyTheme(settings.appearance?.theme);

        // Listen for system changes if in auto mode?
        // CSS handles this mostly, but if we add listeners here we can be more reactive.
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
             const current = await loadSettings();
             if (!current.appearance?.theme || current.appearance?.theme === "auto") {
                 // Re-apply auto logic if needed
                 applyTheme("auto");
             }
        });

    } catch (e) {
        console.warn("Failed to init theme", e);
    }
};

