import { JSON_SCHEMES } from "../../model/Entities";
import type { GPTConversion } from "../endpoints/GPT-Conversion";
import { ASK_WRITE_JSON_FORMAT } from "../endpoints/GPT-Config";

//
export const ASK_ABOUT_KIND_OF_ENTITY = (entityType: string) => `
You are a helpful assistant that can recognize kind of entity. You are given a data source and you need to recognize kind of entity.

This is the kind scheme of ${entityType} entity (enums values):
\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities[entityType].kind.enum, null, 2)}
\`\`\`

Give in JSON format '{ kind: string }'.

${ASK_WRITE_JSON_FORMAT}
`?.trim?.();

//
export const ASK_ABOUT_USABILITY_KIND_OF_BONUS = `
You are a helpful assistant that can recognize usability kind of bonus entity. You are given a data source and you need to recognize usability kind of bonus entity.

This is the kind scheme of ${"bonus"} entity (enums values):
\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities["bonus"].kind.enum, null, 2)}
\`\`\`

This is the usability kind scheme of bonus entity.
\`\`\`
{
    forEntity: enum [
        "item",
        "service",
        "entertainment",
        "action"
    ],
    inEntity: enum [
        "location",
        "market",
        "placement",
        "event",
        "action",
        "person"
    ]
}
\`\`\`

Give in JSON format '{ kind: string, usabilityKind: { forEntity: string, inEntity: string } }'.

${ASK_WRITE_JSON_FORMAT}
`?.trim?.();

//
export const recognizeKindOfEntity = async (entityType: any, gptConversion: GPTConversion)=>{
    gptConversion.addInstruction(entityType == "bonus" ? ASK_ABOUT_USABILITY_KIND_OF_BONUS : ASK_ABOUT_KIND_OF_ENTITY(entityType));
    gptConversion.addToRequest(JSON_SCHEMES.$entities[entityType]);
    const response = await gptConversion.sendRequest();
    return JSON.parse(response?.content)?.kind;
}
