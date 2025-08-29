import H from "fest-src/fest/lure/lure/node/Syntax";

// TODO: This is a legacy component, we should remove it and use the new one
export const TimeHeader = ()=>{
    return H`<div class="timeline-header">
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
    </div>`;
}