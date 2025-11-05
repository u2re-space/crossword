/**
 * AI Helper Utilities
 * Reuses existing AI operations from core
 */

import { generateNewPlan } from '@rs-core/workers/AskToPlan';
import { createTimelineGenerator, requestNewTimeline } from '@rs-core/service/AI-ops/MakeTimeline';
import { GPTResponses } from '@rs-core/service/model/GPT-Responses';
import { loadSettings } from '@rs-core/config/Settings';

/**
 * Generate a new plan using AI
 */
export async function generatePlan(): Promise<{ success: boolean; message: string }> {
    try {
        const response = await generateNewPlan();
        if (response && response.ok) {
            return { success: true, message: 'Plan generated successfully' };
        }
        return { success: false, message: 'Failed to generate plan' };
    } catch (error) {
        console.error('Plan generation error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Create a smart timeline using AI
 */
export async function createSmartTimeline(sourcePath?: string | null): Promise<{
    success: boolean;
    timeline?: any[];
    message: string;
}> {
    try {
        const generator = await createTimelineGenerator(sourcePath || null);
        if (!generator) {
            return { success: false, message: 'Failed to initialize timeline generator' };
        }

        const timeline = await requestNewTimeline(generator, null);
        return {
            success: true,
            timeline: Array.isArray(timeline) ? timeline : [],
            message: `Generated ${Array.isArray(timeline) ? timeline.length : 0} timeline items`
        };
    } catch (error) {
        console.error('Timeline generation error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Initialize GPT Responses instance
 */
export async function initializeGPT(): Promise<GPTResponses | null> {
    try {
        const settings = await loadSettings();
        if (!settings?.ai?.apiKey) {
            return null;
        }

        return new GPTResponses(
            settings.ai.apiKey,
            settings.ai.baseUrl || 'https://api.proxyapi.ru/openai/v1',
            '',
            settings.ai.model || 'gpt-5-mini'
        );
    } catch (error) {
        console.error('GPT initialization error:', error);
        return null;
    }
}

/**
 * Send a message to AI and get response
 */
export async function sendAIMessage(
    gpt: GPTResponses,
    message: string
): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
        await gpt.giveForRequest(message);
        const response = await gpt.sendRequest('medium', 'medium');

        if (response) {
            return { success: true, response };
        }
        return { success: false, error: 'No response from AI' };
    } catch (error) {
        console.error('AI message error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
