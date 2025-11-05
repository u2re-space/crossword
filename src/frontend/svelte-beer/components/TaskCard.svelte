<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Task } from '../stores/tasksStore';
    import { Clock, CheckCircle, Circle, XCircle } from 'phosphor-svelte';

    export let task: Task;
    export let showActions = true;

    const dispatch = createEventDispatcher();

    function getStatusIcon(status?: string) {
        switch (status) {
            case 'completed':
            case 'done':
                return CheckCircle;
            case 'in-progress':
            case 'active':
                return Clock;
            case 'cancelled':
            case 'cancelled':
                return XCircle;
            default:
                return Circle;
        }
    }

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

    $: StatusIcon = getStatusIcon(task.properties?.status);
</script>

<div class="task-card" class:completed={task.properties?.status === 'completed'}>
    <div class="task-header">
        <div class="task-title-row">
            <StatusIcon size={20} class="status-icon" />
            <h3 class="task-title">{task.name || task.title || 'Untitled Task'}</h3>
        </div>
        {#if task.properties?.priority}
            <span class="priority-badge priority-{task.properties.priority.toLowerCase()}">
                {task.properties.priority}
            </span>
        {/if}
    </div>

    {#if task.description}
        <p class="task-description">{task.description}</p>
    {/if}

    <div class="task-footer">
        {#if task.properties?.begin_time}
            <div class="task-time">
                <Clock size={16} />
                <span>{formatDate(task.properties.begin_time)}</span>
            </div>
        {/if}
        {#if showActions}
            <div class="task-actions">
                <button class="action-button" on:click={() => dispatch('edit', task)}>
                    Edit
                </button>
                <button class="action-button" on:click={() => dispatch('delete', task)}>
                    Delete
                </button>
            </div>
        {/if}
    </div>
</div>

<style>
    .task-card {
        background: var(--surface);
        border: 1px solid var(--outline);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        transition: box-shadow 0.2s;
    }

    .task-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .task-card.completed {
        opacity: 0.7;
    }

    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-sm);
    }

    .task-title-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        flex: 1;
    }

    .status-icon {
        color: var(--primary);
        flex-shrink: 0;
    }

    .task-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--on-surface);
    }

    .priority-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .priority-high {
        background: var(--error);
        color: var(--on-error);
    }

    .priority-medium {
        background: var(--warning);
        color: var(--on-warning);
    }

    .priority-low {
        background: var(--success);
        color: var(--on-success);
    }

    .task-description {
        margin: var(--spacing-sm) 0;
        color: var(--on-surface-variant);
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .task-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-sm);
        border-top: 1px solid var(--outline-variant);
    }

    .task-time {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--on-surface-variant);
        font-size: 0.875rem;
    }

    .task-actions {
        display: flex;
        gap: var(--spacing-sm);
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
        background: var(--primary);
        color: var(--on-primary);
    }
</style>
