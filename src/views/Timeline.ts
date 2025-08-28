import { H, M } from "fest/lure";
import { TimeChunk } from "shared/ui/TimeChunk/TimeChunk";
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

// Render the timeline
export const TimelineView = ()=>{
    return H`<section class="timeline c2-surface" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
        <h1>Timeline</h1>
        <div class="timeline-header">
            <div class="time-chunk-header">
                <div class="time-chunk-title">Time event</div>
                <div class="time-chunk-icon"><ui-icon icon="image"></ui-icon></div>
            </div>
            <div class="time-chunk-range">
                <div class="time-chunk-range-start">From</div>
                <div class="time-chunk-range-end">To</div>
            </div>
            <div class="time-chunk-body">
                <div class="time-chunk-description">Description</div>
                <div class="time-chunk-tasks">Tasks</div>
                <div class="time-chunk-location">Location</div>
                <div class="time-chunk-tags">Tags</div>
                <div class="time-chunk-members">Members</div>
                <div class="time-chunk-services">Services</div>
                <div class="time-chunk-actions">Actions</div>
            </div>
            <div class="time-chunk-benefits">
                <div class="time-chunk-rewards">Rewards</div>
                <div class="time-chunk-bonuses">Bonuses</div>
            </div>
        </div>
        ${M(chunks, (chunk)=>TimeChunk(chunk))}
        <button onclick=${addChunk}>Add chunk</button>
    </section>`;
}
