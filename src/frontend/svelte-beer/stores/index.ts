/**
 * Central store initialization
 */
import { tasksStore } from './tasksStore';
import { eventsStore } from './eventsStore';
import { aiStore } from './aiStore';

export async function initializeStores() {
    // Initialize all stores
    await Promise.all([
        tasksStore.load(),
        eventsStore.load(),
        aiStore.initialize()
    ]);
}

export { tasksStore } from './tasksStore';
export { eventsStore } from './eventsStore';
export { aiStore } from './aiStore';
export { currentView } from './viewStore';
