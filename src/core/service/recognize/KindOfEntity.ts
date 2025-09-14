import { JSON_SCHEMES } from "@rs-core/service/template/Entities";
import type { GPTConversion } from "@rs-core/service/model/GPT-Conversion";



//
export const ASK_ABOUT_KIND_OF_ENTITY = (entityType: string) => `
=== BEGIN:PREPARE_DATA ===
This is the kind scheme of ${entityType} entity (enums values):

\`\`\`json
${JSON.stringify(Object.fromEntries([...Object.entries(JSON_SCHEMES.$entities)].map((entity: any) => [entity?.[0], entity?.[1]?.kind?.enum ?? []]).flat()), null, 2)}
\`\`\`
=== END:PREPARE_DATA ===

=== BEGIN:ENTITY_KIND_REQUEST ===
Output in JSON format: \`[...{ kind: string }]\`.
=== END:ENTITY_KIND_REQUEST ===`?.trim?.();



//
export const ASK_ABOUT_USABILITY_KIND_OF_BONUS = `
=== BEGIN:PREPARE_DATA ===
This is the kind scheme of ${"bonus"} entity (enums values):

\`\`\`json
${JSON.stringify(Object.fromEntries([...Object.entries(JSON_SCHEMES.$entities)].map((entity: any) => [entity?.[0], entity?.[1]?.kind?.enum ?? []]).flat()), null, 2)}
\`\`\`
=== END:PREPARE_DATA ===

This is the usability kind scheme of bonus entity:

\`\`\`json
usabilityKind: [...{
    forEntity: array of (enum[
        "item",
        "service",
        "entertainment",
        "action"
    ]),
    inEntity: array of (enum[
        "location",
        "market",
        "placement",
        "event",
        "action",
        "person"
    ]),
}]
}\`\`\`
=== END:PREPARE_DATA ===

=== BEGIN:ENTITY_KIND_REQUEST ===
Output in JSON format: \`\`\`json
[...{
    kind: string,
    usabilityKind: [...{ forEntity: string[], inEntity: string[] }]
}]\`\`\`
=== END:ENTITY_KIND_REQUEST ===
`?.trim?.();

//
export const recognizeKindOfEntity = async (entityType: any, gptConversion: GPTConversion) => {
    gptConversion.askToDoAction(entityType == "bonus" ? ASK_ABOUT_USABILITY_KIND_OF_BONUS : ASK_ABOUT_KIND_OF_ENTITY(entityType));
    const response = await gptConversion.sendRequest();
    return JSON.parse(response?.content)?.kind;
}
