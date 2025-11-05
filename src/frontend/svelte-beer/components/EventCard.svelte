<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Event } from '../stores/eventsStore';
    import { Clock, MapPin } from 'phosphor-svelte';

    export let event: Event;
    export let showActions = true;

    const dispatch = createEventDispatcher();

    function formatDate(dateString?: string) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatTimeRange(begin?: string, end?: string) {
        if (!begin) return '';
        if (end) {
            return `${formatDate(begin)} - ${formatDate(end)}`;
        }
        return formatDate(begin);
    }
</script>

<div class="event-card">
    <div class="event-header">
        <h3 class="event-title">{event.name || event.title || 'Untitled Event'}</h3>
        {#if event.properties?.kind}
            <span class="event-kind">{event.properties.kind}</span>
        {/if}
    </div>

    {#if event.description}
        <p class="event-description">{event.description}</p>
    {/if}

    <div class="event-footer">
        {#if event.properties?.begin_time}
            <div class="event-time">
                <Clock size={16} />
                <span>{formatTimeRange(event.properties.begin_time, event.properties.end_time)}</span>
            </div>
        {/if}
        {#if event.properties?.location}
            <div class="event-location">
                <MapPin size={16} />
                <span>{event.properties.location}</span>
            </div>
        {/if}
        {#if showActions}
            <div class="event-actions">
                <button class="action-button" on:click={() => dispatch('edit', event)}>
                    Edit
                </button>
                <button class="action-button" on:click={() => dispatch('delete', event)}>
                    Delete
                </button>
            </div>
        {/if}
    </div>
</div>

<style>
    .event-card {
        background: var(--surface);
        border: 1px solid var(--secondary);
        border-left: 4px solid var(--secondary);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        transition: box-shadow 0.2s;
    }

    .event-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .event-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-sm);
    }

    .event-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--on-surface);
    }

    .event-kind {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--secondary-container);
        color: var(--on-secondary-container);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .event-description {
        margin: var(--spacing-sm) 0;
        color: var(--on-surface-variant);
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .event-footer {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-sm);
        border-top: 1px solid var(--outline-variant);
    }

    .event-time,
    .event-location {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--on-surface-variant);
        font-size: 0.875rem;
    }

    .event-actions {
        display: flex;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-sm);
    }

    .action-button {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--surface-variant);
        border: 1px solid var(--outline);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--on-surface);
        transition: background-color 0.2s;
    }

    .action-button:hover {
        background: var(--secondary);
        color: var(--on-secondary);
    }
</style>
