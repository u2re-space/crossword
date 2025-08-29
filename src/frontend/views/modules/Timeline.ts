import { H, M } from "fest/lure";
//import { TimeChunk } from "shared/ui/TimeChunk/TimeChunk";
import { makeReactive, ref } from "fest/object";

//
const now = new Date();
const later = ref(new Date(now.getTime() + 60*60*1000));
const chunk = makeReactive({
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
});

//
const chunks = makeReactive([chunk]);


// Editor for the chunk
/*const editor = makeReactive({
    chunk: chunk,
    is_editing: false
});*/

// Add a new chunk to the timeline
const addChunk = ()=>{
    // we have no currently editor!
    //editor.is_editing = true;
}

//${M(chunks, (chunk)=>TimeChunk(chunk))}

// Render the timeline
export const TimelineView = ()=>{
    return H`<section class="timeline c2-surface" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
        <h1>Timeline</h1>
        <button onclick=${addChunk}>Add chunk</button>
    </section>`;
}
