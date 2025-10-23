/*
 * This code makes detailed plan by AI for N day or days (aka. Timeline).
 * Used data: preferences, shortlist of data, some entity set (recognized by preferences context), etc.
 * Info detailed by: description, steps, locations, actions, time, etc.
 * Has few steps:
 * - 0. Send existing timeline data to AI for context (is exists and needed)
 * - 1. Send described preferences data to AI for additional context
 *      - Give current time and date for context, and location for context
 *      - Give factors and events for improve details of plan
 *      - Get optionally suitable entities sets (by shortlist of entities, if exists and needed)
 * - 2. Optional, present some details of entities sets to AI for make plan (if needed and exists)
 *      - Used for recommendations and tips, and improve quality of plan
 * - 3. Get new or modified plan from AI
 * - 4. Handle and save new or modified plan to timeline data
 */

//
import { GPTResponses } from "../model/GPT-Responses";
import { readJSONs, readOneMarkDown } from "@rs-core/workers/FileSystem";
import { realtimeStates } from "../Cache";

// @ts-ignore
import AI_OUTPUT_SCHEMA from "@rs-core/template/Entities-v2.md?raw";

//
import { checkRemainsTime } from "@rs-core/utils/TimeUtils";
import { fixEntityId } from "@rs-core/template/EntityId";
import { loadSettings } from "@rs-core/config/Settings";

//
export const TIMELINE_DIR = "/timeline/";

//
export const PREFERENCES_DIR = "/docs/preferences/";
export const PLANS_DIR = "/docs/plans/";

//
export const FACTORS_DIR = "/data/factors/";
export const EVENTS_DIR = "/data/events/";



// get only today and future tasks, and tasks in the past, but not ended (not finished)
export const filterTasks = (timeline: any[], currentTime: Date, maxDays: number = 7) => {
    return timeline?.filter?.((task) => checkRemainsTime(task?.properties?.begin_time, task?.properties?.end_time, currentTime, maxDays));
}

// get only today and future factors, and factors in the past, but not ended (not finished)
export const filterFactors = (factors: any[], currentTime: Date, maxDays: number = 7) => {
    return factors?.filter?.((factor) => checkRemainsTime(factor?.properties?.begin_time, factor?.properties?.end_time, currentTime, maxDays));
}

// get only today and future events, and events in the past, but not ended (not finished)
export const filterEvents = (events: any[], currentTime: Date, maxDays: number = 7) => {
    return events?.filter?.((event) => checkRemainsTime(event?.properties?.begin_time, event?.properties?.end_time, currentTime, maxDays));
}



//
export const createTimelineGenerator = async (sourcePath: string | null = null) => {
    const settings = await loadSettings();
    if (!settings || !settings?.ai || !settings.ai?.apiKey) return;

    //
    const gptResponses = new GPTResponses(settings.ai?.apiKey || "", settings.ai?.baseUrl || "https://api.proxyapi.ru/openai/v1", "", settings.ai?.model || "gpt-5-mini");
    console.log(gptResponses);

    //
    /*if (settings?.ai?.mcp?.serverLabel && settings.ai.mcp.origin && settings.ai.mcp.clientKey && settings.ai.mcp.secretKey) {
        await gptResponses.useMCP(settings.ai.mcp.serverLabel, settings.ai.mcp.origin, settings.ai.mcp.clientKey, settings.ai.mcp.secretKey)?.catch?.(console.warn.bind(console));
    }*/

    // attach some factors (except finished)
    await gptResponses.giveForRequest("factors: \`" + JSON.stringify(filterFactors(await readJSONs(FACTORS_DIR), (realtimeStates as any)?.time)) + "\`\n");

    // attach some events (except finished)
    await gptResponses.giveForRequest("events: \`" + JSON.stringify(filterEvents(await readJSONs(EVENTS_DIR), (realtimeStates as any)?.time)) + "\`\n");

    //
    if (sourcePath) {
        await gptResponses.giveForRequest("preferences: \`\`\`" + JSON.stringify(await readOneMarkDown(sourcePath)) + "\`\`\`\n");
    } else {
        await gptResponses.giveForRequest("preferences: " + "Make generic working plan for next 7 days..." + "\n");
    }

    //
    await gptResponses.askToDoAction(["primary_request:",
        "Analyze starting and existing data, and get be ready to make a new timeline (preferences data will be attached later)...",
        "Also, can you provide markdown pre-formatted verbose data about what you have analyzed and what you will do?",
        "Give ready status in JSON format: \`{ ready: boolean, reason: string, verbose_data: string }\`"
    ]?.join?.("\n"));

    // load all of those into context
    const readyStatus = JSON.parse(await gptResponses.sendRequest("high", "high") || "{ ready: false, reason: \"No attached data\", keywords: [] }");
    if (!readyStatus?.ready) {
        console.error("timeline", readyStatus);
        return { timeline: [], keywords: [] };
    }

    //
    return gptResponses;
}



//
export const requestNewTimeline = async (gptResponses: GPTResponses, existsTimeline: any | null = null) => {
    if (!gptResponses) return { timeline: [], keywords: [] };

    // attach exists timeline
    if (existsTimeline) {
        await gptResponses.giveForRequest("current_timeline: \`" + JSON.stringify(existsTimeline) + "\`\n");
    }

    //
    const encodedRealtimeState = JSON.stringify({
        time: (realtimeStates as any).time?.toISOString?.(),
        timestamp: (realtimeStates as any).timestamp,
        coords: (realtimeStates as any).coords?.toJSON?.(),
        otherProps: (realtimeStates as any).otherProps,
        cards: (realtimeStates as any).cards,
    });

    // use real-time state (oriented on current time and location)
    await gptResponses.giveForRequest("current_states: \`" + encodedRealtimeState + "\`\n");
    await gptResponses.giveForRequest(AI_OUTPUT_SCHEMA);
    await gptResponses.askToDoAction([
        "Make timeline plan in JSON format, according to given schema. Follow by our preferences is was presented...",
        "Write in JSON format, \`[ array of entity of \"task\" type ]\`"
    ].join?.("\n"));

    //
    const existsResponseId = gptResponses.getResponseId();
    const raw = await gptResponses.sendRequest()?.catch?.(console.warn.bind(console));
    const timelines = raw ? JSON.parse(raw) : "{ ready: false, reason: \"No attached data\", keywords: [] }";
    gptResponses.beginFromResponseId(existsResponseId);

    //
    timelines?.forEach?.((entity: any) => fixEntityId(entity));

    // log timeline
    console.log("timeline", timelines);

    // write timeline
    //await writeTimelineTasks(timelines);

    // return timeline
    return timelines;
}
