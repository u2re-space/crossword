import { loadSettings } from "@rs-core/config/Settings";
import type { AppSettings } from "@rs-core/config/SettingsTypes";
import { applyGridSettings } from "@rs-frontend/utils/StateStorage";

//
export const applyTheme = (settings: AppSettings) => {
    const root = document.documentElement;
    const theme = settings.appearance?.theme || "auto";

    // implemented in veela.css
    //root.dataset.scheme = resolvedTheme;
    root.setAttribute("data-scheme", theme);
    if (settings.appearance?.color) {
        document.body.style.setProperty("--current", settings.appearance.color);
        document.body.style.setProperty("--primary", settings.appearance.color);
        root.style.setProperty("--current", settings.appearance.color);
        root.style.setProperty("--primary", settings.appearance.color);
    }

    // Apply grid settings
    if (settings.grid) {
        applyGridSettings(settings);
    }
};

//
export const initTheme = async () => {
    try {
        const settings = await loadSettings();
        applyTheme(settings);

        // Listen for system changes if in auto mode?
        // CSS handles this mostly, but if we add listeners here we can be more reactive.
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async () => {
            applyTheme(await loadSettings());
        });
    } catch (e) {
        console.warn("Failed to init theme", e);
    }
};
