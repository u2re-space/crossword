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
import { readJSONs, readOneMarkDown } from "@rs-core/workers/FileSystem";
import { realtimeStates } from "../Cache";

// @ts-ignore
import AI_OUTPUT_SCHEMA from "@rs-core/template/Entities-v2.md?raw";

//
import { getDirectoryHandle } from "fest/lure";
import { checkRemainsTime } from "@rs-core/utils/TimeUtils";
import { fixEntityId } from "@rs-core/template/EntityId";
import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

//
export const TIMELINE_DIR = "/timeline/";
export const PREFERENCES_DIR = "/docs/preferences/";
export const FACTORS_DIR = "/data/factors/";
export const PLANS_DIR = "/docs/plans/";
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

//?.split?.("/")?.pop?.()

//
export const writeTimelineTask = async (task: any) => {
    const name = task?.id || task?.name || task?.desc?.name || `${Date.now()}`;

    //
    let fileName = name || "timeline.json"
    fileName = fileName?.endsWith?.(".json") ? fileName : (fileName + ".json");

    //
    const filePath = `${TIMELINE_DIR}${fileName}`;
    const file = new File([JSON.stringify(task)], fileName, { type: 'application/json' });
    return writeFileSmart(null, filePath, file)?.catch?.(console.error.bind(console));
}

//
export const writeTimelineTasks = async (tasks: any[]) => {
    return Promise.all(tasks?.map?.(async (task) => writeTimelineTask(task)) || []);
}


//
export const requestNewTimeline = async (gptResponses: GPTResponses, sourcePath: string | null = null, existsTimeline: any | null = null) => {
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

    // attach some factors (except finished)
    await gptResponses.giveForRequest("factors: \`" + JSON.stringify(filterFactors(await readJSONs(FACTORS_DIR), (realtimeStates as any)?.time)) + "\`\n");

    // attach some events (except finished)
    await gptResponses.giveForRequest("events: \`" + JSON.stringify(filterEvents(await readJSONs(EVENTS_DIR), (realtimeStates as any)?.time)) + "\`\n");

    // attach some plans (except finished)
    //gptResponses.giveForRequest("plans: " + JSON.stringify(await readMarkDowns(PLANS_DIR)) + "\n");
    //gptResponses.giveForRequest("preferences: " + JSON.stringify(await readMarkDowns(PREFERENCES_DIR)) + "\n");

    //
    await gptResponses.askToDoAction(["primary_request:",
        "- Analyze starting and existing data, and get be ready to make a new timeline (preferences data will be attached later)...",
        "- Give answer in JSON format: \`{ ready: boolean, reason: string }\`"
    ]?.join?.("\n"));

    // load all of those into context
    const readyStatus = JSON.parse(await gptResponses.sendRequest() || "{ ready: false, reason: \"No attached data\", keywords: [] }");
    if (!readyStatus?.ready) {
        console.error("timeline", readyStatus);
        return { timeline: [], keywords: [] };
    }

    //
    if (sourcePath) {
        await gptResponses.giveForRequest("preferences: \`\`\`" + JSON.stringify(await readOneMarkDown(sourcePath)) + "\`\`\`\n");
    } else {
        await gptResponses.giveForRequest("preferences: " + "Make generic working plan for next 7 days..." + "\n");
    }

    // get timeline in results
    await gptResponses.giveForRequest(AI_OUTPUT_SCHEMA);
    await gptResponses.askToDoAction([
        "Make timeline plan in JSON format, according to given schema. Follow by our preferences is was presented...",
        "Write in JSON format, \`[ array of entity of \"task\" type ]\`"
    ].join?.("\n"));

    //
    const timelines = JSON.parse(await gptResponses.sendRequest() || "{ ready: false, reason: \"No attached data\", keywords: [] }");
    timelines?.forEach?.((entity: any) => fixEntityId(entity));

    // log timeline
    console.log("timeline", timelines);

    // write timeline
    await writeTimelineTasks(timelines);

    if (typeof document !== "undefined")
        document?.dispatchEvent?.(new CustomEvent("rs-fs-changed", { detail: timelines, bubbles: true, composed: true, cancelable: true, }));

    // return timeline
    return timelines;
}



//
export const loadAllTimelines = async (DIR: string = TIMELINE_DIR) => {
    const dirHandle = await getDirectoryHandle(null, DIR)?.catch?.(console.warn.bind(console));
    const timelines = await Array.fromAsync(dirHandle?.entries?.() ?? []);
    return (await Promise.all(timelines?.map?.(async ([name, fileHandle]: any) => {
        if (name?.endsWith?.(".crswap")) return;
        if (!name?.trim?.()?.endsWith?.(".json")) return;

        //
        const file = await fileHandle.getFile();
        const item = JSON.parse(await file?.text?.() || "{}");
        (item as any).__name = name;
        (item as any).__path = `${DIR}${name}`;
        return item;
    })))?.filter?.((e) => e);
}
