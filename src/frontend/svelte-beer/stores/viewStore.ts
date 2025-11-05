import { writable } from 'svelte/store';

export type ViewType = 'planner' | 'schedule' | 'organizer' | 'ai';

export const currentView = writable<ViewType>('planner');

export function setView(view: ViewType) {
    currentView.set(view);
}
