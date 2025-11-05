import { writable, derived } from 'svelte/store';
import { readJSONs } from '@rs-core/workers/FileSystem';
import type { EntityInterface } from '@rs-core/template/EntityInterface';

export interface Event extends EntityInterface<any, any> {
    id: string;
    name: string;
    title?: string;
    description?: string;
    properties?: {
        begin_time?: string;
        end_time?: string;
        status?: string;
        kind?: string;
        location?: string;
    };
}

const EVENTS_DIR = '/data/events/';

const events = writable<Event[]>([]);
const loading = writable<boolean>(false);
const error = writable<string | null>(null);

export const eventsStore = {
    subscribe: events.subscribe,
    loading,
    error,

    async load() {
        loading.set(true);
        error.set(null);
        try {
            const data = await readJSONs(EVENTS_DIR);
            events.set(data || []);
        } catch (err) {
            console.error('Failed to load events:', err);
            error.set(err instanceof Error ? err.message : 'Failed to load events');
        } finally {
            loading.set(false);
        }
    },

    add(event: Event) {
        events.update(es => [...es, event]);
    },

    update(id: string, updates: Partial<Event>) {
        events.update(es =>
            es.map(e => e.id === id ? { ...e, ...updates } : e)
        );
    },

    remove(id: string) {
        events.update(es => es.filter(e => e.id !== id));
    }
};

export const eventsByDate = derived(events, $events => {
    const grouped = new Map<string, Event[]>();
    $events.forEach(event => {
        const date = event.properties?.begin_time
            ? new Date(event.properties.begin_time).toISOString().split('T')[0]
            : 'no-date';
        if (!grouped.has(date)) {
            grouped.set(date, []);
        }
        grouped.get(date)!.push(event);
    });
    return grouped;
});
