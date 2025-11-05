import { writable } from 'svelte/store';
import { GPTResponses } from '@rs-core/service/model/GPT-Responses';
import { loadSettings } from '@rs-core/config/Settings';

export interface AIMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface AIConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
}

const messages = writable<AIMessage[]>([]);
const config = writable<AIConfig | null>(null);
const loading = writable<boolean>(false);
const error = writable<string | null>(null);
const gptInstance = writable<GPTResponses | null>(null);

export const aiStore = {
    subscribe: messages.subscribe,
    config,
    loading,
    error,
    gptInstance,

    async initialize() {
        try {
            const settings = await loadSettings();
            if (settings?.ai) {
                const aiConfig: AIConfig = {
                    apiKey: settings.ai.apiKey || '',
                    baseUrl: settings.ai.baseUrl || 'https://api.proxyapi.ru/openai/v1',
                    model: settings.ai.model || 'gpt-5-mini'
                };
                config.set(aiConfig);

                if (aiConfig.apiKey) {
                    const gpt = new GPTResponses(
                        aiConfig.apiKey,
                        aiConfig.baseUrl,
                        '',
                        aiConfig.model
                    );
                    gptInstance.set(gpt);
                }
            }
        } catch (err) {
            console.error('Failed to initialize AI store:', err);
            error.set(err instanceof Error ? err.message : 'Failed to initialize AI');
        }
    },

    addMessage(message: Omit<AIMessage, 'id' | 'timestamp'>) {
        const newMessage: AIMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date()
        };
        messages.update(msgs => [...msgs, newMessage]);
        return newMessage;
    },

    async sendMessage(content: string) {
        const userMessage = this.addMessage({
            role: 'user',
            content
        });

        loading.set(true);
        error.set(null);

        try {
            const $gptInstance = new Promise<GPTResponses | null>((resolve) => {
                gptInstance.subscribe(instance => resolve(instance))();
            });

            const gpt = await $gptInstance;
            if (!gpt) {
                throw new Error('AI not initialized. Please check your API key in settings.');
            }

            await gpt.giveForRequest(content);
            const response = await gpt.sendRequest('medium', 'medium');

            if (response) {
                this.addMessage({
                    role: 'assistant',
                    content: response
                });
            } else {
                throw new Error('No response from AI');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            error.set(err instanceof Error ? err.message : 'Failed to send message');
            this.addMessage({
                role: 'system',
                content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        } finally {
            loading.set(false);
        }
    },

    clearMessages() {
        messages.set([]);
    }
};
