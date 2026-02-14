import { loadSettings } from "@rs-com/config/Settings";
import type { AppSettings } from "@rs-com/config/SettingsTypes";
import { applyGridSettings } from "@rs-core/storage/StateStorage";

//
const resolveColorScheme = (theme: AppSettings["appearance"] extends { theme?: infer T } ? T : never) => {
    if (theme === "dark" || theme === "light") return theme;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
};

const resolveFontSize = (size?: AppSettings["appearance"] extends { fontSize?: infer T } ? T : never) => {
    switch (size) {
        case "small":
            return "14px";
        case "large":
            return "18px";
        case "medium":
        default:
            return "16px";
    }
};

//
export const applyTheme = (settings: AppSettings) => {
    const root = document.documentElement;
    const theme = settings.appearance?.theme || "auto";
    const resolvedScheme = resolveColorScheme(theme);

    // implemented in veela.css
    root.setAttribute("data-scheme", theme);
    root.setAttribute("data-theme", resolvedScheme);
    root.style.colorScheme = resolvedScheme;
    root.style.fontSize = resolveFontSize(settings.appearance?.fontSize);
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
