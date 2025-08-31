import { H } from "fest/lure";
import { makeReactive, ref } from "fest/object";

//
const now = new Date();
const later = ref(new Date(now.getTime() + 60*60*1000));

//
export const taskItems = makeReactive([
    makeReactive({
        title: "Sample event",
        icon: "calendar",
        description: "Demo entry in the timeline",
        begin_time: now,
        end_time: later,
        location: "Downtown",
        tags: ["demo"],
        members: [],
        services: [],
        actions: [],
        rewards: [],
        bonuses: []
    })
]);


// Editor for the chunk
/*const editor = makeReactive({
    chunk: chunk,
    is_editing: false
});*/

// Add a new chunk to the timeline
const addTaskItem = ()=>{
    // we have no currently editor!
    //editor.is_editing = true;
}

//${M(taskItems, (taskItem)=>TaskItem(taskItem))}

// Render the timeline
export const TasksTimelineView = ()=>{
    return H`<section class="timeline c2-surface" style="background-color: --c2-surface(0.0, var(--current, currentColor));">
        <h1>Timeline</h1>
        <button onclick=${addTaskItem}>Add task item</button>
    </section>`;
}
