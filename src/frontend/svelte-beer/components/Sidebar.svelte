<script lang="ts">
    import { setView, currentView } from '../stores/viewStore';
    import { Calendar, Clipboard, List, Sparkle } from 'phosphor-svelte';

    const menuItems = [
        { id: 'planner', label: 'Planner', icon: Calendar },
        { id: 'schedule', label: 'Schedule', icon: Clipboard },
        { id: 'organizer', label: 'Organizer', icon: List },
        { id: 'ai', label: 'AI Tools', icon: Sparkle }
    ];
</script>

<aside class="sidebar">
    <nav class="sidebar-nav">
        <div class="sidebar-header">
            <h2 class="sidebar-title">Planner</h2>
        </div>
        <ul class="menu-list">
            {#each menuItems as item}
                <li class="menu-item">
                    <button
                        class="menu-button"
                        class:active={$currentView === item.id}
                        on:click={() => setView(item.id as any)}
                        aria-label={item.label}
                    >
                        <svelte:component this={item.icon} size={24} />
                        <span class="menu-label">{item.label}</span>
                    </button>
                </li>
            {/each}
        </ul>
    </nav>
</aside>

<style>
    .sidebar {
        width: 240px;
        background: var(--surface);
        border-right: 1px solid var(--outline);
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
    }

    .sidebar-header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--outline);
    }

    .sidebar-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--on-surface);
    }

    .sidebar-nav {
        flex: 1;
        overflow-y: auto;
    }

    .menu-list {
        list-style: none;
        margin: 0;
        padding: var(--spacing-sm);
    }

    .menu-item {
        margin-bottom: var(--spacing-xs);
    }

    .menu-button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: transparent;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: background-color 0.2s;
        color: var(--on-surface);
        text-align: left;
    }

    .menu-button:hover {
        background: var(--surface-variant);
    }

    .menu-button.active {
        background: var(--primary);
        color: var(--on-primary);
    }

    .menu-label {
        font-size: 0.9375rem;
        font-weight: 500;
    }
</style>
