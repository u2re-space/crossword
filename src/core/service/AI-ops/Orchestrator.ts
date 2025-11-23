import { createTimelineGenerator, requestNewTimeline } from "@rs-core/service/AI-ops/MakeTimeline";
import { queueEntityForWriting, pushToIDBQueue } from "@rs-core/service/AI-ops/ServiceHelper";

// Shared state for timeline generator
let timelineGenerator: any = null;

export interface MakeTimelineResult {
    ok: boolean;
    results: any[];
    error?: any;
}

export const handleMakeTimeline = async (source: string | null, speechPrompt: string | null): Promise<MakeTimelineResult> => {
    try {
        // Initialize generator if needed
        timelineGenerator ||= await createTimelineGenerator(source, speechPrompt).catch(console.warn);
        if (!timelineGenerator) {
            return { ok: false, results: [], error: "Failed to initialize timeline generator" };
        }

        console.log("Timeline Generator:", timelineGenerator);

        // Request new timeline
        const timelines = await requestNewTimeline(timelineGenerator).catch(console.warn);
        console.log("Generated Timelines:", timelines);

        if (!timelines || !Array.isArray(timelines)) {
             return { ok: false, results: [], error: "No timelines generated" };
        }

        // Queue results
        const results: any[] = [];
        timelines.forEach((timeline) => {
            results.push(queueEntityForWriting(timeline, "task", "json"));
        });

        // Persist to IDB Queue
        await pushToIDBQueue(results).catch(console.warn);

        return { ok: true, results };
    } catch (error) {
        console.error("Error in handleMakeTimeline:", error);
        return { ok: false, results: [], error };
    }
};

