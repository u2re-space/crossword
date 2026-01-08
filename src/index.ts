// Import routing and choice functionality
import { initPWA, checkForUpdates, forceRefreshAssets } from "./frontend/pwa/pwa-handling";
import { loadSubApp } from "./frontend/routing/routing";
import { ChoiceScreen, type FrontendChoice } from "./frontend/routing/boot-menu";

// Import PWA handlers
import {
    ensureAppCss,
    initServiceWorker,
    initReceivers,
    handleShareTarget,
    setupLaunchQueueConsumer,
    checkPendingShareData
} from "./frontend/pwa/sw-handling";

// Import uniform channel manager
import { initializeAppChannels, channelManager } from "./com/core/UniformChannelManager";




// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get normalized pathname accounting for base href and origin
 */
const getNormalizedPathname = () => {
    const pathname = location.pathname || '';
    const baseElement = document.querySelector('base');
    const baseHref = baseElement?.getAttribute('href') || '/';

    console.log('[Pathname] Raw pathname:', pathname);
    console.log('[Pathname] Base href:', baseHref);
    console.log('[Pathname] Origin:', location.origin);

    // If base href is not root and pathname starts with base path, strip it
    let normalizedPath = pathname;
    if (baseHref !== '/' && pathname.startsWith(baseHref.replace(/\/$/, ''))) {
        normalizedPath = pathname.slice(baseHref.replace(/\/$/, '').length);
        console.log('[Pathname] Stripped base path:', normalizedPath);
    }

    // Remove leading slash and normalize
    normalizedPath = normalizedPath.replace(/^\//, '').trim().toLowerCase();
    console.log('[Pathname] Final normalized:', normalizedPath);

    return normalizedPath;
};

const isExtension = () => {
    try {
        return window.location.protocol === "chrome-extension:" || Boolean((chrome as any)?.runtime?.id);
    } catch {
        return false;
    }
};

const isPwaDisplayMode = () => {
    if (!isExtension()) return true;
    return false;
};

const loadChoice = (): FrontendChoice | null => {
    try {
        const v = localStorage.getItem("rs-frontend-choice");
        return v === "basic" || v === "faint" ? v : null;
    } catch {
        return null;
    }
};

const loadRemember = (): boolean => {
    try {
        return localStorage.getItem("rs-frontend-choice-remember") === "1";
    } catch {
        return false;
    }
};

const saveChoice = (choice: FrontendChoice, remember: boolean) => {
    try {
        localStorage.setItem("rs-frontend-choice", choice);
        localStorage.setItem("rs-frontend-choice-remember", remember ? "1" : "0");
    } catch {
        // ignore
    }
};

// ============================================================================
// LOADING STATE MANAGEMENT
// ============================================================================

// ============================================================================
// LOADING STATE MANAGEMENT
// ============================================================================

/**
 * Set loading state with proper visual feedback
 */
const setLoadingState = (mountElement: HTMLElement, message: string = "Loading...") => {
    mountElement.innerHTML = `
        <div class="app-loading" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            inline-size: 100%;
            block-size: 100%;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 1.1rem;
            color: #666;
            background: #fff;
            position: absolute;
            inset: 0;
            z-index: 10000;
        ">
            <div class="loading-spinner" style="
                inline-size: 32px;
                block-size: 32px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #007acc;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            "></div>
            <div class="loading-text">${message}</div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </div>
    `;
};

/**
 * Clear loading state and prepare for app mounting
 */
const clearLoadingState = (mountElement: HTMLElement) => {
    const loading = mountElement.querySelector('.app-loading') as HTMLElement | null;
    if (loading) {
        loading.style.transition = 'opacity 0.3s ease-out';
        loading.style.opacity = '0';
        setTimeout(() => {
            if (loading.parentNode) {
                loading.remove();
            }
        }, 300);
    }
};

/**
 * Show error state with retry option
 */
const showErrorState = (mountElement: HTMLElement, error: any, retryFn?: () => void) => {
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    mountElement.innerHTML = `
        <div class="app-error" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            inline-size: 100%;
            block-size: 100%;
            padding: 2rem;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            background: #fff;
            color: #333;
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h2 style="margin: 0 0 1rem 0; color: #d32f2f;">Application Error</h2>
            <p style="margin: 0 0 1.5rem 0; color: #666; max-inline-size: 500px;">${errorMessage}</p>
            ${retryFn ? `
                <button onclick="(${retryFn.toString()})()" style="
                    padding: 0.75rem 1.5rem;
                    background: #007acc;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    margin-bottom: 1rem;
                    transition: background-color 0.2s;
                " onmouseover="this.style.background='#005999'" onmouseout="this.style.background='#007acc'">
                    Try Again
                </button>
            ` : ''}
            <button onclick="location.reload()" style="
                padding: 0.5rem 1rem;
                background: #666;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 0.9rem;
                cursor: pointer;
            ">
                Reload Page
            </button>
        </div>
    `;
};

// ============================================================================
// APP LOADING SYSTEM
// ============================================================================

// ============================================================================
// MAIN INDEX FUNCTION
// ============================================================================

export default async function index(mountElement: HTMLElement) {
    console.log('[Index] Starting CrossWord frontend loader');

    // Initialize uniform channel manager
    console.log('[Index] Initializing uniform channels...');
    initializeAppChannels();

    // Set initial loading state
    setLoadingState(mountElement, 'Initializing CrossWord...');

    try {
        // Initialize PWA features (non-blocking)
        const pwaPromise = initPWA();

        // Ensure CSS is loaded for frontend (only if not extension)
        if (!isExtension()) {
            console.log('[Index] Loading CSS...');
            setLoadingState(mountElement, 'Loading styles...');
            await ensureAppCss();
            console.log('[Index] CSS loaded');
        }

        // Clear loading state and prepare for app
        clearLoadingState(mountElement);
        setLoadingState(mountElement, 'Loading application...');

        // Initialize broadcast receivers for service worker communication
        console.log('[Index] Initializing broadcast receivers...');
        initReceivers();
        console.log('[Index] Broadcast receivers ready');

        // Handle share target data if coming from PWA share
        console.log('[Index] Setting up share target handling...');
        handleShareTarget();
        console.log('[Index] Share target handling ready');

        // Initialize service worker and other PWA features
        console.log('[Index] Initializing service worker...');
        await initServiceWorker();
        console.log('[Index] Service worker ready');

        // Set up launch queue consumer for PWA file launches
        console.log('[Index] Setting up launch queue consumer...');
        await setupLaunchQueueConsumer();
        console.log('[Index] Launch queue consumer ready');

        // Check for pending share data from server-side handler
        console.log('[Index] Checking for pending share data...');
        try {
            await checkPendingShareData();
        } catch (error) {
            console.warn('[Index] Pending share data check failed:', error);
        }
        console.log('[Index] Pending share data check complete');

        // Wait for PWA initialization
        await pwaPromise;
        console.log('[Index] PWA initialization complete');

        // Handle route changes from boot menu
        const handleRouteChange = async (event: Event) => {
            const { path, source } = (event as CustomEvent)?.detail ?? {};
            console.log('[Index] Route change from', source, 'to path:', path);

            if (source === 'boot-menu') {
                // Handle navigation from boot menu
                if (path === 'basic') {
                    clearLoadingState(mountElement);
                    setLoadingState(mountElement, 'Loading Basic Edition...');
                    try {
                        const appLoader = await loadSubApp('basic');
                        clearLoadingState(mountElement);
                        await appLoader.mount(mountElement);
                        console.log('[Index] Basic app loaded from route change');
                    } catch (error) {
                        console.error('[Index] Failed to load basic app from route:', error);
                        showErrorState(mountElement, error, () => index(mountElement));
                    }
                } else if (path === 'faint') {
                    clearLoadingState(mountElement);
                    setLoadingState(mountElement, 'Loading Experimental Edition...');
                    try {
                        const appLoader = await loadSubApp('faint');
                        clearLoadingState(mountElement);
                        await appLoader.mount(mountElement);
                        console.log('[Index] Faint app loaded from route change');
                    } catch (error) {
                        console.error('[Index] Failed to load faint app from route:', error);
                        showErrorState(mountElement, error, () => index(mountElement));
                    }
                }
            }
        };

        window.addEventListener('route-changed', handleRouteChange);

        const defaultChoice: FrontendChoice = "basic";

        // Single source of truth for routing - client handles all decisions
        const adjustedPathname = getNormalizedPathname();
        const urlParams = new URLSearchParams(window.location.search);
        const markdownContent = urlParams.get('markdown-content');
        const sharedFlag = urlParams.get('shared');

        console.log('[Index] Processing route:', adjustedPathname);

        // Share target entry paths should always resolve into Basic (then Basic consumes cache + shows preview).
        if (adjustedPathname === "share-target" || adjustedPathname === "share_target") {
            console.log('[Index] Share target route - forcing Basic app load');
            clearLoadingState(mountElement);
            const appLoader = await loadSubApp("basic");
            await appLoader.mount(mountElement);
            console.log('[Index] Basic app loaded (share target route)');
            return;
        }

        if (!adjustedPathname || adjustedPathname === "" || adjustedPathname === "/") {
            // Root path is normally boot menu, but query-driven launches must bypass it:
            // - Share target redirects to "/?shared=1"
            // - Launch queue may use "?markdown-content=..."
            if (sharedFlag === "1" || sharedFlag === "true" || Boolean(markdownContent)) {
                console.log('[Index] Root path with share/markdown params - forcing Basic app load');
                clearLoadingState(mountElement);
                const appLoader = await loadSubApp("basic");
                await appLoader.mount(mountElement);
                console.log('[Index] Basic app loaded (root param override)');
                return;
            }

            clearLoadingState(mountElement);
            const appLoader = await loadSubApp("");
            await appLoader.mount(mountElement);
            console.log('[Index] Boot menu loaded');
            return;
        }

        // Direct route handling - no remembered choice for specific paths
        if (adjustedPathname === "basic") {
            console.log('[Index] Direct route: loading basic app');
            clearLoadingState(mountElement);
            const appLoader = await loadSubApp("basic");
            await appLoader.mount(mountElement);
            console.log('[Index] Basic app loaded');
            return;
        }

        if (adjustedPathname === "faint") {
            console.log('[Index] Direct route: loading faint app');
            clearLoadingState(mountElement);
            const appLoader = await loadSubApp("faint");
            await appLoader.mount(mountElement);
            console.log('[Index] Faint app loaded');
            return;
        }

        if (adjustedPathname === "print") {
            console.log('[Index] Direct route: loading print view');
            clearLoadingState(mountElement);
            // Print uses basic app with special print handling
            const appLoader = await loadSubApp("print");
            await appLoader.mount(mountElement);
            console.log('[Index] Print app loaded for print');
            return;
        }

        // Root path "/" - check for remembered choice or show choice screen
        console.log('[Index] Root path - checking user preferences');

        const isExt = isExtension();
        const pwa = isPwaDisplayMode();
        const remembered = loadRemember();
        const stored = loadChoice();

        console.log('[Index] Context: extension=%s, pwa=%s, remembered=%s, stored=%s', isExt, pwa, remembered, stored);

        // Special case: markdown content from file launch
        if (markdownContent) {
            console.log('[Index] Markdown content detected - loading basic app');
            clearLoadingState(mountElement);
            const appLoader = await loadSubApp("basic");
            await appLoader.mount(mountElement);
            console.log('[Index] Basic app loaded for markdown');
            return;
        }

        // Use remembered choice if available (only for root path)
        if (!isExt && pwa && remembered && stored) {
            console.log('[Index] Using remembered choice:', stored);
            clearLoadingState(mountElement);
            const appLoader = await loadSubApp(stored);
            await appLoader.mount(mountElement);
            console.log('[Index] Remembered app loaded');
            return;
        }

        // Extension or non-PWA: load default
        if (isExt || !pwa) {
            console.log('[Index] Loading default app (extension or non-PWA)');
            clearLoadingState(mountElement);
            const appLoader = await loadSubApp(defaultChoice);
            await appLoader.mount(mountElement);
            console.log('[Index] Default app loaded');
            return;
        }

        // PWA with no remembered choice: show choice screen
        console.log('[Index] No remembered choice - showing choice screen');
        clearLoadingState(mountElement);
        mountElement.replaceChildren();

        let done = false;
        let seconds = 10;
        const { container, countdownEl } = ChoiceScreen({
            seconds,
            defaultChoice,
            initialRemember: remembered,
            tryRoutedPath: true,
            onChoose: async (choice, remember) => {
                if (done) return;
                console.log('[Index] User chose:', choice, 'remember:', remember);
                done = true;
                clearInterval(timer);
                if (remember) saveChoice(choice, true);
                else saveChoice(choice, false);

                // Clear choice screen and show loading for selected app
                mountElement.replaceChildren();
                setLoadingState(mountElement, `Loading ${choice === 'basic' ? 'Basic Edition' : 'Experimental Edition'}...`);

                try {
                    const appLoader = await loadSubApp(choice);
                    clearLoadingState(mountElement);
                    await appLoader.mount(mountElement);
                    console.log('[Index] Chosen app loaded');
                    } catch (error) {
                    console.error('[Index] Failed to load chosen app:', error);
                    showErrorState(mountElement, error, () => index(mountElement));
                }
            },
        });

        const timer = window.setInterval(() => {
            if (done) return;
            seconds -= 1;
            const b = countdownEl.querySelector("b");
            if (b) b.textContent = String(Math.max(0, seconds));
            if (seconds <= 0) {
                console.log('[Index] Auto-starting default app');
                done = true;
                clearInterval(timer);
                void (async () => {
                    mountElement.replaceChildren();
                    setLoadingState(mountElement, 'Loading Basic Edition...');
                    try {
                        const appLoader = await loadSubApp(defaultChoice);
                        clearLoadingState(mountElement);
                        await appLoader.mount(mountElement);
                        console.log('[Index] Default app auto-loaded');
                    } catch (error) {
                        console.error('[Index] Failed to auto-load default app:', error);
                        showErrorState(mountElement, error, () => index(mountElement));
                    }
                })();
            }
        }, 1000);

        mountElement.append(container);
        console.log('[Index] Choice screen displayed');

    } catch (error) {
        console.error('[Index] Frontend loader failed:', error);
        showErrorState(mountElement, error, () => index(mountElement));
    }
}

// ============================================================================
// EXPORTS FOR EXTERNAL USE
// ============================================================================

export { checkForUpdates, forceRefreshAssets, index };

