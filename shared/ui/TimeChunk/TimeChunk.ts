import {H} from "fest/lure";

//
export const TimeChunk = (timeChunk: any) => {
    return H`
    <div class="time-chunk">
        <div class="time-chunk-header">
            <div class="time-chunk-title">${timeChunk.title}</div>
            <div class="time-chunk-icon"><ui-icon icon=${timeChunk.icon}></ui-icon></div>
        </div>
        <div class="time-chunk-range">
            <div class="time-chunk-range-start">${timeChunk.begin_time.toLocaleTimeString()}</div>
            <div class="time-chunk-range-end">${timeChunk.end_time.toLocaleTimeString()}</div>
        </div>
        <div class="time-chunk-body">
            <div class="time-chunk-description">${timeChunk.description}</div>
            <div class="time-chunk-tasks">${timeChunk.tasks}</div>
            <div class="time-chunk-location">${timeChunk.location}</div>
            <div class="time-chunk-tags">${timeChunk.tags}</div>
            <div class="time-chunk-members">${timeChunk.members}</div>
            <div class="time-chunk-services">${timeChunk.services}</div>
            <div class="time-chunk-actions">${timeChunk.actions}</div>
        </div>
        <div class="time-chunk-benefits">
            <div class="time-chunk-rewards">${timeChunk.rewards}</div>
            <div class="time-chunk-bonuses">${timeChunk.bonuses}</div>
        </div>
    </div>
    `
};
