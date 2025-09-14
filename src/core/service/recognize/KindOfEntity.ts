import { JSON_SCHEMES } from "@rs-core/service/template/Entities";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";



//
export const ASK_ABOUT_KIND_OF_ENTITY = (entityTypes: string[]) => `
=== BEGIN:PREPARE_DATA ===
This is the kind scheme of ${entityTypes?.join(", ")} entities (enums values):

\`\`\`json
${JSON.stringify(Object.fromEntries([...Object.entries(JSON_SCHEMES.$entities)].map((entity: any) => [entity?.[0], entity?.[1]?.kind?.enum ?? []]).flat()), null, 2)}
\`\`\`
=== END:PREPARE_DATA ===

=== BEGIN:ENTITY_RELATED_REQUEST ===
if (if is 'bonus' entity, there is additional usability kind scheme)
This is the usability kind scheme of ${entityTypes?.join(", ")} entities:

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
=== END:ENTITY_RELATED_REQUEST ===

=== BEGIN:ENTITY_KIND_REQUEST ===
Output in JSON format: \`\`\`json
[...{
    kinds: string[],
    usabilityKinds: [...{ forEntity: string[], inEntity: string[] }]
}]\`\`\`
=== END:ENTITY_KIND_REQUEST ===
`?.trim?.();

//
export const recognizeKindOfEntity = async (entityTypes: any[], gptResponses: GPTResponses) => {
    gptResponses.askToDoAction(ASK_ABOUT_KIND_OF_ENTITY(entityTypes));
    const response = await gptResponses.sendRequest();
    return JSON.parse(response?.content);
}
