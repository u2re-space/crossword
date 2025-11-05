<script lang="ts">
    import { onMount } from 'svelte';
    import AIAssistant from '../components/AIAssistant.svelte';
    import { aiStore } from '../stores/aiStore';
    import { Sparkle, Brain, MagicWand, Robot } from 'phosphor-svelte';

    onMount(() => {
        aiStore.initialize();
    });

    $: isConfigured = $aiStore.config?.apiKey ? true : false;
</script>

<div class="ai-tools-view">
    <div class="ai-header">
        <div class="header-content">
            <h1 class="page-title">AI Tools</h1>
            <p class="page-subtitle">Leverage AI to plan, schedule, and organize</p>
        </div>
    </div>

    {#if !isConfigured}
        <div class="config-warning">
            <div class="warning-content">
                <Brain size={24} class="warning-icon" />
                <div class="warning-text">
                    <h3>AI Not Configured</h3>
                    <p>Please configure your AI API key in settings to use AI features.</p>
                </div>
            </div>
        </div>
    {/if}

    <div class="ai-features">
        <div class="feature-card">
            <div class="feature-icon">
                <MagicWand size={32} />
            </div>
            <h3 class="feature-title">Smart Planning</h3>
            <p class="feature-description">
                Generate intelligent plans based on your preferences, goals, and current context.
            </p>
        </div>

        <div class="feature-card">
            <div class="feature-icon">
                <Sparkle size={32} />
            </div>
            <h3 class="feature-title">Auto Scheduling</h3>
            <p class="feature-description">
                Let AI automatically schedule your tasks and events based on priorities and availability.
            </p>
        </div>

        <div class="feature-card">
            <div class="feature-icon">
                <Robot size={32} />
            </div>
            <h3 class="feature-title">AI Assistant</h3>
            <p class="feature-description">
                Chat with AI to get suggestions, answer questions, and optimize your workflow.
            </p>
        </div>
    </div>

    <div class="ai-assistant-container">
        <AIAssistant />
    </div>
</div>

<style>
    .ai-tools-view {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
    }

    .ai-header {
        margin-bottom: var(--spacing-md);
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

    .config-warning {
        padding: var(--spacing-lg);
        background: var(--warning-container);
        color: var(--on-warning-container);
        border: 1px solid var(--warning);
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-lg);
    }

    .warning-content {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-md);
    }

    .warning-icon {
        flex-shrink: 0;
    }

    .warning-text {
        flex: 1;
    }

    .warning-text h3 {
        margin: 0 0 var(--spacing-xs) 0;
        font-size: 1.125rem;
        font-weight: 600;
    }

    .warning-text p {
        margin: 0;
        font-size: 0.9375rem;
    }

    .ai-features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
    }

    .feature-card {
        padding: var(--spacing-lg);
        background: var(--surface);
        border: 1px solid var(--outline);
        border-radius: var(--radius-lg);
        text-align: center;
        transition: box-shadow 0.2s;
    }

    .feature-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto var(--spacing-md);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-container);
        color: var(--on-primary-container);
        border-radius: var(--radius-lg);
    }

    .feature-title {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--on-surface);
    }

    .feature-description {
        margin: 0;
        font-size: 0.9375rem;
        color: var(--on-surface-variant);
        line-height: 1.5;
    }

    .ai-assistant-container {
        flex: 1;
        min-height: 500px;
    }
</style>
