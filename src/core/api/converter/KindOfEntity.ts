import { JSON_SCHEMES } from "../../model/Entities";
import type { GPTConversion } from "../endpoints/GPT-Conversion";



//
export const ASK_ABOUT_KIND_OF_ENTITY = (entityType: string) => `
This is the kind scheme of ${entityType} entity (enums values):

\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities[entityType].kind.enum, null, 2)}
\`\`\`

Output in JSON format: \`{ kind: string }\`.`?.trim?.();



//
export const ASK_ABOUT_USABILITY_KIND_OF_BONUS = `
This is the kind scheme of ${"bonus"} entity (enums values):

\`\`\`json
${JSON.stringify(JSON_SCHEMES.$entities["bonus"].kind.enum, null, 2)}
\`\`\`


This is the usability kind scheme of bonus entity:

\`\`\`json
usabilityKind: {
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
}\`\`\`


Output in JSON format: \`\`\`json
{
    kind: string,
    usabilityKind: { forEntity: string, inEntity: string }
}\`\`\``?.trim?.();

//
export const recognizeKindOfEntity = async (entityType: any, gptConversion: GPTConversion)=>{
    gptConversion.addToRequest(JSON_SCHEMES.$entities[entityType], null, entityType == "bonus" ? ASK_ABOUT_USABILITY_KIND_OF_BONUS : ASK_ABOUT_KIND_OF_ENTITY(entityType));
    const response = await gptConversion.sendRequest();
    return JSON.parse(response?.content)?.kind;
}
