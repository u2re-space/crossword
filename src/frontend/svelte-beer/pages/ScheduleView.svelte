<script lang="ts">
    import { onMount } from 'svelte';
    import { tasksStore } from '../stores/tasksStore';
    import { eventsStore } from '../stores/eventsStore';
    import CalendarView from '../components/CalendarView.svelte';

    onMount(() => {
        tasksStore.load();
        eventsStore.load();
    });
</script>

<div class="schedule-view">
    <div class="schedule-header">
        <h1 class="page-title">Schedule</h1>
        <p class="page-subtitle">View and manage your calendar</p>
    </div>

    <div class="schedule-content">
        <CalendarView />
    </div>
</div>

<style>
    .schedule-view {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: var(--spacing-lg);
    }

    .schedule-header {
        margin-bottom: var(--spacing-lg);
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

    .schedule-content {
        flex: 1;
        overflow: hidden;
    }
</style>
