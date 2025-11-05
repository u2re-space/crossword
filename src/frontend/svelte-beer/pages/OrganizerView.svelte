<script lang="ts">
    import { onMount } from 'svelte';
    import { tasksStore, tasksByStatus } from '../stores/tasksStore';
    import { eventsStore } from '../stores/eventsStore';
    import TaskCard from '../components/TaskCard.svelte';
    import EventCard from '../components/EventCard.svelte';
    import { Plus, Funnel, SortAscending } from 'phosphor-svelte';

    let selectedStatus = 'all';
    let sortBy = 'date';

    onMount(() => {
        tasksStore.load();
        eventsStore.load();
    });

    function handleAddTask() {
        // TODO: Open task editor
        console.log('Add task');
    }

    function handleAddEvent() {
        // TODO: Open event editor
        console.log('Add event');
    }

    function getFilteredTasks() {
        let tasks = Array.from($tasksStore);

        if (selectedStatus !== 'all') {
            tasks = tasks.filter(t => t.properties?.status === selectedStatus);
        }

        if (sortBy === 'date') {
            tasks.sort((a, b) => {
                const dateA = a.properties?.begin_time ? new Date(a.properties.begin_time).getTime() : 0;
                const dateB = b.properties?.begin_time ? new Date(b.properties.begin_time).getTime() : 0;
                return dateA - dateB;
            });
        } else if (sortBy === 'priority') {
            tasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const priorityA = priorityOrder[a.properties?.priority?.toLowerCase() as keyof typeof priorityOrder] || 0;
                const priorityB = priorityOrder[b.properties?.priority?.toLowerCase() as keyof typeof priorityOrder] || 0;
                return priorityB - priorityA;
            });
        }

        return tasks;
    }

    $: filteredTasks = getFilteredTasks();
</script>

<div class="organizer-view">
    <div class="organizer-header">
        <div class="header-content">
            <h1 class="page-title">Organizer</h1>
            <p class="page-subtitle">Organize and filter your tasks and events</p>
        </div>
        <div class="header-actions">
            <button class="action-button" on:click={handleAddTask}>
                <Plus size={20} />
                <span>Add Task</span>
            </button>
            <button class="action-button" on:click={handleAddEvent}>
                <Plus size={20} />
                <span>Add Event</span>
            </button>
        </div>
    </div>

    <div class="organizer-filters">
        <div class="filter-group">
            <label class="filter-label">
                <Funnel size={16} />
                <span>Filter by Status</span>
            </label>
            <select class="filter-select" bind:value={selectedStatus}>
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
            </select>
        </div>

        <div class="filter-group">
            <label class="filter-label">
                <SortAscending size={16} />
                <span>Sort By</span>
            </label>
            <select class="filter-select" bind:value={sortBy}>
                <option value="date">Date</option>
                <option value="priority">Priority</option>
                <option value="name">Name</option>
            </select>
        </div>
    </div>

    <div class="organizer-content">
        <div class="tasks-section">
            <h2 class="section-title">Tasks ({filteredTasks.length})</h2>
            <div class="items-list">
                {#if $tasksStore.loading}
                    <div class="loading-state">Loading tasks...</div>
                {:else if filteredTasks.length === 0}
                    <div class="empty-state">
                        <p>No tasks found. {selectedStatus !== 'all' ? 'Try changing the filter.' : 'Create your first task!'}</p>
                    </div>
                {:else}
                    {#each filteredTasks as task}
                        <TaskCard {task} />
                    {/each}
                {/if}
            </div>
        </div>

        <div class="events-section">
            <h2 class="section-title">Events ({$eventsStore.length})</h2>
            <div class="items-list">
                {#if $eventsStore.loading}
                    <div class="loading-state">Loading events...</div>
                {:else if $eventsStore.length === 0}
                    <div class="empty-state">
                        <p>No events found. Create your first event!</p>
                    </div>
                {:else}
                    {#each $eventsStore as event}
                        <EventCard {event} />
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    .organizer-view {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
    }

    .organizer-header {
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

    .header-actions {
        display: flex;
        gap: var(--spacing-sm);
    }

    .action-button {
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

    .action-button:hover {
        opacity: 0.9;
    }

    .organizer-filters {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--surface);
        border: 1px solid var(--outline);
        border-radius: var(--radius-lg);
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        flex: 1;
    }

    .filter-label {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--on-surface-variant);
    }

    .filter-select {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--outline);
        border-radius: var(--radius-md);
        background: var(--surface);
        color: var(--on-surface);
        font-size: 0.9375rem;
        cursor: pointer;
    }

    .filter-select:focus {
        outline: none;
        border-color: var(--primary);
    }

    .organizer-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-lg);
    }

    .tasks-section,
    .events-section {
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

    .items-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        max-height: 600px;
        overflow-y: auto;
    }

    .loading-state,
    .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--on-surface-variant);
    }

    @media (max-width: 1024px) {
        .organizer-content {
            grid-template-columns: 1fr;
        }
    }
</style>
