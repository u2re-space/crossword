import { loadSettings } from "@rs-core/config/Settings";
import { startTracking } from "@rs-core/workers/GeoLocation";

//
export const loadPlanSource = async (): Promise<string | null> => {
    try {
        const stored = await loadSettings();
        return stored?.timeline?.source || null;
    } catch (e) {
        console.warn(e);
        return null;
    }
};

//
export const generateNewPlan = async () => {
    const settings = await loadSettings();
    if (!settings || !settings?.ai || !settings.ai?.apiKey) return;

    //
    await startTracking?.()?.catch?.(console.warn.bind(console));

    //
    try {
        const source = await loadPlanSource();

        //
        const timelineForm = new FormData();
        if (source) { timelineForm.append("source", source); };

        //
        return fetch("/make-timeline", {
            method: "POST",
            body: timelineForm,
        })?.catch?.(console.warn.bind(console));
    } catch (e) {
        console.warn(e);
    }
};
