import App from './App.svelte';
import './styles/main.scss';
import { mount, type SvelteComponent } from 'svelte';

//
export interface FrontendOptions {
    mountElement?: HTMLElement;
}

/**
 * Main frontend bootstrap function
 * Compatible with the core bootstrap pattern
 * Returns a Svelte 5 component instance
 */
export default function frontend(mountElement?: HTMLElement): InstanceType<typeof App> | undefined {
    if (!mountElement) {
        console.warn('No mount element provided for svelte-beer frontend');
        return;
    }

    if (typeof window === 'undefined') {
        console.warn('Window is not available for svelte-beer frontend');
        return;
    }

    // Initialize Beer CSS
    if ((window as any).beercss) {
        (window as any).beercss.init();
    }

    // Create and mount the Svelte app (Svelte 5 compatible)
    return mount(App as any, { target: mountElement });
}

//
export { frontend };
