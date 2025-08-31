import {H} from "fest/lure";

//
export const TaskItem = (taskItem: any) => {
    return H`
    <div class="time-chunk">
        <div class="time-chunk-header">
            <div class="time-chunk-title">${taskItem.title}</div>
            <div class="time-chunk-icon"><ui-icon icon=${taskItem.icon}></ui-icon></div>
        </div>
        <div class="time-chunk-range">
            <div class="time-chunk-range-start">${taskItem.begin_time.toLocaleTimeString()}</div>
            <div class="time-chunk-range-end">${taskItem.end_time.toLocaleTimeString()}</div>
        </div>
        <div class="time-chunk-body">
            <div class="time-chunk-description">${taskItem.description}</div>
            <div class="time-chunk-tasks">${taskItem.tasks}</div>
            <div class="time-chunk-location">${taskItem.location}</div>
            <div class="time-chunk-tags">${taskItem.tags}</div>
            <div class="time-chunk-members">${taskItem.members}</div>
            <div class="time-chunk-services">${taskItem.services}</div>
            <div class="time-chunk-actions">${taskItem.actions}</div>
        </div>
        <div class="time-chunk-benefits">
            <div class="time-chunk-rewards">${taskItem.rewards}</div>
            <div class="time-chunk-bonuses">${taskItem.bonuses}</div>
        </div>
    </div>
    `
};
