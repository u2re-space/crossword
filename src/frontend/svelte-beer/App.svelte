<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import PlannerDashboard from './pages/PlannerDashboard.svelte';
    import ScheduleView from './pages/ScheduleView.svelte';
    import OrganizerView from './pages/OrganizerView.svelte';
    import AIToolsView from './pages/AIToolsView.svelte';
    import Sidebar from './components/Sidebar.svelte';
    import { currentView } from './stores/viewStore';
    import { initializeStores } from './stores';

    // Initialize stores on mount
    onMount(() => {
        initializeStores();
    });

    // View components map
    const views = {
        planner: PlannerDashboard,
        schedule: ScheduleView,
        organizer: OrganizerView,
        ai: AIToolsView
    };

    $: CurrentView = views[$currentView] || views.planner;
</script>

<div class="app-container">
    <Sidebar />
    <main class="main-content">
        <CurrentView />
    </main>
</div>

<style>
    .app-container {
        display: flex;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
    }

    .main-content {
        flex: 1;
        overflow: auto;
        padding: var(--spacing-md);
    }
</style>
