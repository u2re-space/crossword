import { JSON_SCHEMES } from "@rs-core/service/template/Entities";
import type { GPTResponses } from "@rs-core/service/model/GPT-Responses";



//
export const ASK_ABOUT_KIND_OF_ENTITY = (entityTypes: { entityType: string; }[]) => `
=== BEGIN:EXPLAIN_KINDS_ENUMS ===
This is the enums of kinds of scheme by entity types (enums values):

\`\`\`json
${JSON.stringify(entityTypes?.map?.((type) => ([...Object.entries(JSON_SCHEMES.$entities)]?.find?.(entry => (type?.entityType ?? "unknown") == (entry?.[0] ?? "unknown"))?.[1]?.kind?.enum ?? [])) || [], null, 2)}
\`\`\`

Search at least one kind for each entity type, or 'unknown' if no kind found.
=== END:EXPLAIN_KINDS_ENUMS ===



=== BEGIN:ENTITY_RELATED_REQUEST_ADDITION ===
if ones of entityType is 'bonus' entity, there is additional usability kind scheme
Search relevant and related usability kind schemes of 'bonus' entity:

\`\`\`json
usabilityKind: [...{
    forEntity: array of (one of enum[
        "item",
        "service",
        "entertainment",
        "action"
    ]) or [],
    inEntity: array of (one of enum[
        "location",
        "market",
        "placement",
        "event",
        "action",
        "person"
    ]) or [],
}] or []
}\`\`\`
=== END:ENTITY_RELATED_REQUEST_ADDITION ===


=== BEGIN:ENTITY_KIND_REQUEST_OUTPUT ===
Output in JSON format: \`\`\`json
[...{
    kind: string[],
    usabilityKind: [...{ forEntity: string[], inEntity: string[] }] or []
}]\`\`\`
=== END:ENTITY_KIND_REQUEST_OUTPUT ===
`?.trim?.();

//
export const recognizeKindOfEntity = async (entityTypes: { entityType: string; }[], gptResponses: GPTResponses) => {
    await gptResponses.askToDoAction(ASK_ABOUT_KIND_OF_ENTITY(entityTypes));
    const parsed = JSON.parse(await gptResponses.sendRequest() || "[]");
    console.log("Second step response: ", parsed);
    return parsed;
}
