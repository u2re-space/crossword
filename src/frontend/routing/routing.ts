import type { FrontendChoice } from "./boot-menu";

// ============================================================================
// APP LOADING SYSTEM
// ============================================================================

/**
 * Load and initialize a sub-app with proper error handling
 */
export const loadSubApp = async (choice?: FrontendChoice): Promise<{ mount: (el: HTMLElement) => Promise<void> }> => {
    console.log('[App] Loading sub-app:', choice);

    try {
        let module;
        if (choice === "faint") {
            console.log('[App] Importing faint app...');
            module = await import("../faint/layout/Views");
            console.log('[App] Faint app imported successfully');
        } else
        if (choice == "basic") {
            console.log('[App] Importing basic app...');
            module = await import("../basic");
            console.log('[App] Basic app imported successfully');
        } else
        if (choice == "print") {
            console.log('[App] Importing print app...');
            module = await import("../print");
            console.log('[App] Print app imported successfully');
        } else
        if (choice == "airpad") {
            console.log('[App] Importing airpad app...');
            module = await import("../airpad");
            console.log('[App] Airpad app imported successfully');
        } else
        if (!choice || choice == "/") {
            console.log('[App] Importing basic app...');
            module = await import("./boot-menu");
            console.log('[App] Basic app imported successfully');
        }

        const mountFunction = module?.default;
        if (typeof mountFunction !== 'function') {
            throw new Error(`Invalid app module: expected default export to be a function, got ${typeof mountFunction}`);
        }

        return {
            mount: async (mountElement: HTMLElement) => {
                console.log('[App] Mounting', choice, 'app...');
                await mountFunction(mountElement);
                console.log('[App] App mounted successfully');
            }
        };
    } catch (error) {
        console.error('[App] Failed to load sub-app:', choice, error);
        throw error;
    }
};