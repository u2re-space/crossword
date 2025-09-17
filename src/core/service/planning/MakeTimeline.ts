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
import type { GPTResponses } from "../model/GPT-Responses";
import { readJSONs, readMarkDowns } from "@rs-core/workers/FileSystem";
import { TIMELINE_DIR, realtimeStates } from "../Cache";
import { JSON_SCHEMES } from "../template/Entities";
import { safe } from "fest/object";
import { writeFile } from "fest/lure";

//
export const PREFERENCES_DIR = "/docs/preferences/";
export const FACTORS_DIR = "/data/factors/";
export const PLANS_DIR = "/docs/plans/";
export const EVENTS_DIR = "/data/events/";



//
const MAKE_TIMELINE_REQUEST = `
=== BEGIN:MAKE_TIMELINE_REQUEST ===
You are given factors, preferences, events and exists timeline and you need to be ready to make a new timeline.
Also, you need to return keywords for timeline, which will be used for search and filter timeline (also, needed for debugging).
If you got attached data, return \`\`\`json{ ready: true, keywords: string[] }\`\`\`, else return \`\`\`json{ ready: false, reason: string }\`\`\`.
=== END:MAKE_TIMELINE_REQUEST ===
`;

//
const OUTPUT_RESULTS_IN_JSON = `
=== BEGIN:OUTPUT_RESULTS_IN_JSON ===
Output new timelines in JSON format: \`\`\`json
[...${JSON.stringify(JSON_SCHEMES.$task, null, 2)}]
\`\`\`

Give in results (outputs) only code or JSON string, without any additional comments.

Don't write anything else, just the JSON format, do not write comments, do not write anything else.
=== END:OUTPUT_RESULTS_IN_JSON ===
`;



//
const checkInTimeRange = (beginTime: Date, endTime: Date, currentTime: Date) => {
    // after begins and before ends
    if (beginTime && endTime) {
        return new Date(beginTime) < currentTime && currentTime < new Date(endTime);
    }
    // after begins
    if (beginTime) {
        return new Date(beginTime) < currentTime;
    }
    // before ends
    if (endTime) {
        return currentTime < new Date(endTime);
    }
    return false;
}

//
const checkRemainsTime = (beginTime: Date, endTime: Date, currentTime: Date) => {
    // utils begins and before ends
    if (beginTime && endTime) {
        return new Date(beginTime) > currentTime && currentTime < new Date(endTime);
    }
    // utils begins
    if (beginTime) {
        return new Date(beginTime) > currentTime;
    }
    // before ends
    if (endTime) {
        return currentTime < new Date(endTime);
    }
    return false;
}



// get only today and future tasks, and tasks in the past, but not ended (not finished)
const filterTasks = (timeline: any[], currentTime: Date) => {
    return timeline?.filter?.((task) => checkRemainsTime(task?.properties?.begin_time, task?.properties?.end_time, currentTime));
}

// get only today and future factors, and factors in the past, but not ended (not finished)
const filterFactors = (factors: any[], currentTime: Date) => {
    return factors?.filter?.((factor) => checkRemainsTime(factor?.properties?.begin_time, factor?.properties?.end_time, currentTime));
}

// get only today and future events, and events in the past, but not ended (not finished)
const filterEvents = (events: any[], currentTime: Date) => {
    return events?.filter?.((event) => checkRemainsTime(event?.properties?.begin_time, event?.properties?.end_time, currentTime));
}



//
export const writeTimelineTask = async (task: any) => {
    const fileName = `${TIMELINE_DIR}/${task?.desc?.name}.json`;
    const file = new File([JSON.stringify(task)], fileName?.split?.("/")?.pop?.() || "timeline.json", { type: 'application/json' });
    return writeFile(null, fileName, file)?.catch?.(console.error.bind(console));
}



//
export const requestNewTimeline = async (gptResponses: GPTResponses, existsTimeline: any | null = null) => {
    gptResponses.attachToRequest(MAKE_TIMELINE_REQUEST);

    // attach exists timeline
    if (existsTimeline) {
        gptResponses.attachToRequest("current timeline: " + JSON.stringify(existsTimeline) + "\n");
    }

    // use real-time state (oriented on current time and location)
    gptResponses.attachToRequest("realtime states: " + JSON.stringify(safe(realtimeStates)) + "\n");

    // attach some plans (except finished)
    const plans = await readMarkDowns(PLANS_DIR);
    gptResponses.attachToRequest("plans: " + JSON.stringify(filterTasks(plans, (realtimeStates as any)?.time)) + "\n");

    // attach some preferences (except finished)
    const preferences = await readMarkDowns(PREFERENCES_DIR);
    gptResponses.attachToRequest("preferences: " + JSON.stringify(filterTasks(preferences, (realtimeStates as any)?.time)) + "\n");

    // attach some factors (except finished)
    const factors = await readJSONs(FACTORS_DIR);
    gptResponses.attachToRequest("factors: " + JSON.stringify(filterFactors(factors, (realtimeStates as any)?.time)) + "\n");

    // attach some events (except finished)
    const events = await readJSONs(EVENTS_DIR);
    gptResponses.attachToRequest("events: " + JSON.stringify(filterEvents(events, (realtimeStates as any)?.time)) + "\n");

    // load into context
    const readyStatus = JSON.parse(await gptResponses.sendRequest() || "{ ready: false, reason: 'No attached data', keywords: [] }");
    if (!readyStatus?.ready) {
        console.error("timeline", readyStatus);
        return { timeline: [], keywords: [] };
    }

    // get timeline in results
    await gptResponses.askToDoAction(OUTPUT_RESULTS_IN_JSON);
    const timeline = JSON.parse(await gptResponses.sendRequest() || "{ ready: false, reason: 'No attached data', keywords: [] }");

    // log timeline
    console.log("timeline", timeline);

    // write timeline
    await writeTimelineTask(timeline);

    // return timeline
    return timeline;
}
