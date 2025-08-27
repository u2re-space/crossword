import {H} from "fest/lure";

//
export const EntityCard = (entity: any) => {
    return H`
    <div class="entity-card">
        <div class="entity-card-header">
            <div class="entity-card-icon">${entity.icon}</div>
            <h3 class="entity-card-title">${entity.name}</h3>
        </div>
        <div class="entity-card-content">
            <div class="entity-card-kind">${entity.kind}</div>
            <div class="entity-card-description">${entity.description}</div>
            <div class="entity-card-tags">${entity.tags}</div>
            <div class="entity-card-location">${entity.location}</div>
            <div class="entity-card-members">${entity.members}</div>
            <div class="entity-card-services">${entity.services}</div>
            <div class="entity-card-actions">${entity.actions}</div>
        </div>
        <div class="entity-card-footer">
            <div class="entity-card-bonuses">${entity.bonuses}</div>
            <div class="entity-card-rewards">${entity.rewards}</div>
        </div>
    </div>
    `
};
