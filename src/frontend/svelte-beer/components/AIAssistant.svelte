<script lang="ts">
    import { onMount } from 'svelte';
    import { aiStore } from '../stores/aiStore';
    import { PaperPlaneRight, Sparkle } from 'phosphor-svelte';
    import { generateNewPlan } from '@rs-core/workers/AskToPlan';
    import { createTimelineGenerator, requestNewTimeline } from '@rs-core/service/AI-ops/MakeTimeline';

    let input = '';
    let isGenerating = false;

    $: messages = $aiStore;
    $: isLoading = $aiStore.loading;
    $: error = $aiStore.error;

    async function sendMessage() {
        if (!input.trim() || isLoading) return;

        const message = input.trim();
        input = '';
        await aiStore.sendMessage(message);
    }

    async function handleGeneratePlan() {
        isGenerating = true;
        try {
            await generateNewPlan();
            aiStore.addMessage({
                role: 'assistant',
                content: 'Plan generation started. Your timeline will be updated shortly.'
            });
        } catch (err) {
            aiStore.addMessage({
                role: 'system',
                content: `Error generating plan: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        } finally {
            isGenerating = false;
        }
    }

    async function handleSmartSchedule() {
        isGenerating = true;
        try {
            const generator = await createTimelineGenerator(null);
            if (generator) {
                const timeline = await requestNewTimeline(generator, null);
                aiStore.addMessage({
                    role: 'assistant',
                    content: `Generated ${timeline.length || 0} timeline items based on your preferences and current context.`
                });
            }
        } catch (err) {
            aiStore.addMessage({
                role: 'system',
                content: `Error creating schedule: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        } finally {
            isGenerating = false;
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }
</script>

<div class="ai-assistant">
    <div class="ai-header">
        <div class="ai-title-row">
            <Sparkle size={24} class="ai-icon" />
            <h2 class="ai-title">AI Assistant</h2>
        </div>
        <div class="ai-actions">
            <button class="action-button" on:click={handleGeneratePlan} disabled={isGenerating}>
                Generate Plan
            </button>
            <button class="action-button" on:click={handleSmartSchedule} disabled={isGenerating}>
                Smart Schedule
            </button>
        </div>
    </div>

    <div class="messages-container">
        {#if $messages.length === 0}
            <div class="empty-state">
                <p>Start a conversation with the AI assistant. Ask questions, request plans, or get scheduling suggestions.</p>
            </div>
        {/if}

        {#each $messages as message}
            <div class="message" class:user={message.role === 'user'} class:system={message.role === 'system'}>
                <div class="message-content">
                    {#if message.role === 'assistant'}
                        <Sparkle size={16} class="message-icon" />
                    {/if}
                    <div class="message-text">
                        {message.content}
                    </div>
                </div>
                <div class="message-time">
                    {message.timestamp.toLocaleTimeString()}
                </div>
            </div>
        {/each}

        {#if isLoading}
            <div class="message loading">
                <div class="message-content">
                    <Sparkle size={16} class="message-icon" />
                    <div class="message-text">
                        <span class="loading-dots">Thinking</span>
                    </div>
                </div>
            </div>
        {/if}

        {#if error}
            <div class="message error">
                <div class="message-content">
                    <div class="message-text">
                        Error: {error}
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <div class="input-container">
        <textarea
            class="message-input"
            bind:value={input}
            on:keydown={handleKeyPress}
            placeholder="Ask the AI assistant anything..."
            disabled={isLoading || isGenerating}
            rows="2"
        />
        <button
            class="send-button"
            on:click={sendMessage}
            disabled={!input.trim() || isLoading || isGenerating}
        >
            <PaperPlaneRight size={20} />
        </button>
    </div>
</div>

<style>
    .ai-assistant {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 800px;
        background: var(--surface);
        border: 1px solid var(--outline);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .ai-header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--outline);
        background: var(--surface-variant);
    }

    .ai-title-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
    }

    .ai-icon {
        color: var(--primary);
    }

    .ai-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--on-surface);
    }

    .ai-actions {
        display: flex;
        gap: var(--spacing-sm);
    }

    .action-button {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--primary);
        color: var(--on-primary);
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: opacity 0.2s;
    }

    .action-button:hover:not(:disabled) {
        opacity: 0.9;
    }

    .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .empty-state {
        text-align: center;
        color: var(--on-surface-variant);
        padding: var(--spacing-xl);
    }

    .message {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        max-width: 80%;
        animation: fadeIn 0.3s;
    }

    .message.user {
        align-self: flex-end;
    }

    .message.system {
        align-self: center;
        max-width: 100%;
    }

    .message.error {
        background: var(--error-container);
        color: var(--on-error-container);
    }

    .message-content {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background: var(--surface-variant);
        border-radius: var(--radius-md);
    }

    .message.user .message-content {
        background: var(--primary);
        color: var(--on-primary);
    }

    .message-icon {
        flex-shrink: 0;
        color: var(--primary);
    }

    .message.user .message-icon {
        color: var(--on-primary);
    }

    .message-text {
        flex: 1;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .message-time {
        font-size: 0.75rem;
        color: var(--on-surface-variant);
        padding: 0 var(--spacing-md);
    }

    .loading-dots::after {
        content: '...';
        animation: dots 1.5s steps(4, end) infinite;
    }

    @keyframes dots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60%, 100% { content: '...'; }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .input-container {
        display: flex;
        gap: var(--spacing-sm);
        padding: var(--spacing-lg);
        border-top: 1px solid var(--outline);
        background: var(--surface);
    }

    .message-input {
        flex: 1;
        padding: var(--spacing-md);
        border: 1px solid var(--outline);
        border-radius: var(--radius-md);
        background: var(--surface);
        color: var(--on-surface);
        font-family: inherit;
        font-size: 0.9375rem;
        resize: none;
        min-height: 60px;
    }

    .message-input:focus {
        outline: none;
        border-color: var(--primary);
    }

    .message-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .send-button {
        padding: var(--spacing-md);
        background: var(--primary);
        color: var(--on-primary);
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
        min-width: 48px;
    }

    .send-button:hover:not(:disabled) {
        opacity: 0.9;
    }

    .send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
