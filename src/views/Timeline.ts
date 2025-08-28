import { H } from "fest/lure";
import { TimeChunk } from "shared/ui/TimeChunk/TimeChunk";

//
export const TimelineView = ()=>{
    const now = new Date();
    const later = new Date(now.getTime() + 60*60*1000);
    const chunk = {
        title: "Sample event",
        icon: "calendar",
        description: "Demo entry in the timeline",
        begin_time: now,
        end_time: later,
        tasks: [],
        location: "Downtown",
        tags: ["demo"],
        members: [],
        services: [],
        actions: [],
        rewards: [],
        bonuses: []
    };
    return H`<section><h2>Timeline</h2>${TimeChunk(chunk)}</section>`;
}
