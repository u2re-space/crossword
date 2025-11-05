<script lang="ts">
    import { onMount } from 'svelte';
    import { tasksStore, tasksByStatus } from '../stores/tasksStore';
    import { eventsStore } from '../stores/eventsStore';
    import TaskCard from '../components/TaskCard.svelte';
    import { Plus, Calendar, Clock, CheckCircle, XCircle } from 'phosphor-svelte';

    onMount(() => {
        tasksStore.load();
        eventsStore.load();
    });

    function getStatusCount(status: string) {
        return $tasksByStatus.get(status)?.length || 0;
    }

    function handleAddTask() {
        // TODO: Open task editor modal
        console.log('Add task');
    }

    function handleTaskEdit(event: CustomEvent) {
        // TODO: Open task editor with task data
        console.log('Edit task:', event.detail);
    }

    function handleTaskDelete(event: CustomEvent) {
        // TODO: Confirm and delete task
        console.log('Delete task:', event.detail);
        tasksStore.remove(event.detail.id);
    }
</script>

<div class="planner-dashboard">
    <div class="dashboard-header">
        <div class="header-content">
            <h1 class="page-title">Planner Dashboard</h1>
            <p class="page-subtitle">Overview of your tasks and schedule</p>
        </div>
        <button class="add-button" on:click={handleAddTask}>
            <Plus size={20} />
            <span>Add Task</span>
        </button>
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon pending">
                <Clock size={24} />
            </div>
            <div class="stat-content">
                <div class="stat-value">{getStatusCount('pending') + getStatusCount('in-progress')}</div>
                <div class="stat-label">Active Tasks</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon completed">
                <CheckCircle size={24} />
            </div>
            <div class="stat-content">
                <div class="stat-value">{getStatusCount('completed')}</div>
                <div class="stat-label">Completed</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon upcoming">
                <Calendar size={24} />
            </div>
            <div class="stat-content">
                <div class="stat-value">{$eventsStore.length}</div>
                <div class="stat-label">Upcoming Events</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon cancelled">
                <XCircle size={24} />
            </div>
            <div class="stat-content">
                <div class="stat-value">{getStatusCount('cancelled')}</div>
                <div class="stat-label">Cancelled</div>
            </div>
        </div>
    </div>

    <div class="dashboard-content">
        <div class="content-section">
            <h2 class="section-title">Recent Tasks</h2>
            <div class="tasks-list">
                {#if $tasksStore.loading}
                    <div class="loading-state">Loading tasks...</div>
                {:else if $tasksStore.length === 0}
                    <div class="empty-state">
                        <p>No tasks yet. Create your first task to get started!</p>
                    </div>
                {:else}
                    {#each $tasksStore.slice(0, 10) as task}
                        <TaskCard
                            {task}
                            on:edit={handleTaskEdit}
                            on:delete={handleTaskDelete}
                        />
                    {/each}
                {/if}
            </div>
        </div>

        <div class="content-section">
            <h2 class="section-title">Upcoming Events</h2>
            <div class="events-list">
                {#if $eventsStore.loading}
                    <div class="loading-state">Loading events...</div>
                {:else if $eventsStore.length === 0}
                    <div class="empty-state">
                        <p>No upcoming events.</p>
                    </div>
                {:else}
                    {#each $eventsStore.slice(0, 5) as event}
                        <div class="event-item">
                            <div class="event-time">
                                {event.properties?.begin_time
                                    ? new Date(event.properties.begin_time).toLocaleDateString()
                                    : 'No date'}
                            </div>
                            <div class="event-name">{event.name || event.title || 'Untitled Event'}</div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .planner-dashboard {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-md);
    }

    .header-content {
        flex: 1;
    }

    .page-title {
        margin: 0 0 var(--spacing-xs) 0;
        font-size: 2rem;
        font-weight: 700;
        color: var(--on-surface);
    }

    .page-subtitle {
        margin: 0;
        color: var(--on-surface-variant);
        font-size: 1rem;
    }

    .add-button {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--primary);
        color: var(--on-primary);
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.9375rem;
        font-weight: 500;
        transition: opacity 0.2s;
    }

    .add-button:hover {
        opacity: 0.9;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: var(--surface);
        border: 1px solid var(--outline);
        border-radius: var(--radius-lg);
        transition: box-shadow 0.2s;
    }

    .stat-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
    }

    .stat-icon.pending {
        background: var(--warning-container);
        color: var(--on-warning-container);
    }

    .stat-icon.completed {
        background: var(--success-container);
        color: var(--on-success-container);
    }

    .stat-icon.upcoming {
        background: var(--primary-container);
        color: var(--on-primary-container);
    }

    .stat-icon.cancelled {
        background: var(--error-container);
        color: var(--on-error-container);
    }

    .stat-content {
        flex: 1;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--on-surface);
        line-height: 1;
        margin-bottom: var(--spacing-xs);
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--on-surface-variant);
    }

    .dashboard-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--spacing-lg);
    }

    .content-section {
        background: var(--surface);
        border: 1px solid var(--outline);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
    }

    .section-title {
        margin: 0 0 var(--spacing-md) 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--on-surface);
    }

    .tasks-list,
    .events-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .loading-state,
    .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--on-surface-variant);
    }

    .event-item {
        padding: var(--spacing-md);
        background: var(--surface-variant);
        border-radius: var(--radius-md);
        border-left: 4px solid var(--secondary);
    }

    .event-time {
        font-size: 0.875rem;
        color: var(--on-surface-variant);
        margin-bottom: var(--spacing-xs);
    }

    .event-name {
        font-weight: 600;
        color: var(--on-surface);
    }

    @media (max-width: 768px) {
        .dashboard-content {
            grid-template-columns: 1fr;
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
