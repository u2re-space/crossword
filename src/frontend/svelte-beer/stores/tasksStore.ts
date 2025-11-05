import { writable, derived } from 'svelte/store';
import { readJSONs } from '@rs-core/workers/FileSystem';
import type { EntityInterface } from '@rs-core/template/EntityInterface';

export interface Task extends EntityInterface<any, any> {
    id: string;
    name: string;
    title?: string;
    description?: string;
    properties?: {
        begin_time?: string;
        end_time?: string;
        status?: string;
        priority?: string;
        kind?: string;
    };
}

const TIMELINE_DIR = '/timeline/';

// Create writable store
const tasks = writable<Task[]>([]);
const loading = writable<boolean>(false);
const error = writable<string | null>(null);

export const tasksStore = {
    subscribe: tasks.subscribe,
    loading,
    error,

    async load() {
        loading.set(true);
        error.set(null);
        try {
            const data = await readJSONs(TIMELINE_DIR);
            tasks.set(data || []);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            error.set(err instanceof Error ? err.message : 'Failed to load tasks');
        } finally {
            loading.set(false);
        }
    },

    add(task: Task) {
        tasks.update(ts => [...ts, task]);
    },

    update(id: string, updates: Partial<Task>) {
        tasks.update(ts =>
            ts.map(t => t.id === id ? { ...t, ...updates } : t)
        );
    },

    remove(id: string) {
        tasks.update(ts => ts.filter(t => t.id !== id));
    },

    getById(id: string): Task | undefined {
        let result: Task | undefined;
        tasks.subscribe(t => {
            result = t.find(task => task.id === id);
        })();
        return result;
    }
};

// Derived stores
export const tasksByDate = derived(tasks, $tasks => {
    const grouped = new Map<string, Task[]>();
    $tasks.forEach(task => {
        const date = task.properties?.begin_time
            ? new Date(task.properties.begin_time).toISOString().split('T')[0]
            : 'no-date';
        if (!grouped.has(date)) {
            grouped.set(date, []);
        }
        grouped.get(date)!.push(task);
    });
    return grouped;
});

export const tasksByStatus = derived(tasks, $tasks => {
    const grouped = new Map<string, Task[]>();
    $tasks.forEach(task => {
        const status = task.properties?.status || 'pending';
        if (!grouped.has(status)) {
            grouped.set(status, []);
        }
        grouped.get(status)!.push(task);
    });
    return grouped;
});
