/**
 * Data Helper Utilities
 * Reuses existing file system and data operations from core
 */

import { readJSONs } from '@rs-core/workers/FileSystem';
import { writeFileSmart } from '@rs-core/workers/WriteFileSmart-v2';
import type { EntityInterface } from '@rs-core/template/EntityInterface';
import { fixEntityId } from '@rs-core/template/EntityId';

const TIMELINE_DIR = '/timeline/';
const EVENTS_DIR = '/data/events/';
const TASKS_DIR = '/data/tasks/';

/**
 * Load tasks from timeline directory
 */
export async function loadTasks(): Promise<EntityInterface<any, any>[]> {
    try {
        return await readJSONs(TIMELINE_DIR);
    } catch (error) {
        console.error('Failed to load tasks:', error);
        return [];
    }
}

/**
 * Load events from events directory
 */
export async function loadEvents(): Promise<EntityInterface<any, any>[]> {
    try {
        return await readJSONs(EVENTS_DIR);
    } catch (error) {
        console.error('Failed to load events:', error);
        return [];
    }
}

/**
 * Save a task to the timeline
 */
export async function saveTask(
    task: EntityInterface<any, any>,
    directory: string = TIMELINE_DIR
): Promise<{ success: boolean; error?: string }> {
    try {
        fixEntityId(task);
        const fileName = `${task.id || crypto.randomUUID()}.json`;
        const file = new File(
            [JSON.stringify(task, null, 2)],
            fileName,
            { type: 'application/json' }
        );

        await writeFileSmart(null, directory, file, {
            ensureJson: true,
            sanitize: true
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to save task:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Save an event
 */
export async function saveEvent(
    event: EntityInterface<any, any>,
    directory: string = EVENTS_DIR
): Promise<{ success: boolean; error?: string }> {
    try {
        fixEntityId(event);
        const fileName = `${event.id || crypto.randomUUID()}.json`;
        const file = new File(
            [JSON.stringify(event, null, 2)],
            fileName,
            { type: 'application/json' }
        );

        await writeFileSmart(null, directory, file, {
            ensureJson: true,
            sanitize: true
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to save event:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (Math.abs(diffDays) > 7) {
        return formatDate(d);
    } else if (Math.abs(diffDays) > 0) {
        return diffDays > 0 ? `in ${diffDays} day${diffDays !== 1 ? 's' : ''}` : `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
    } else if (Math.abs(diffHours) > 0) {
        return diffHours > 0 ? `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}` : `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`;
    } else if (Math.abs(diffMinutes) > 0) {
        return diffMinutes > 0 ? `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}` : `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''} ago`;
    } else {
        return 'now';
    }
}
