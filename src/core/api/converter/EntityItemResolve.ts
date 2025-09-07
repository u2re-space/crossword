import { ABOUT_NAME_ID_GENERATION, JSON_SCHEMES } from "../../model/Entities";
import type { GPTConversion } from "../endpoints/GPT-Conversion";
import { safe } from "fest/object";

//
export const resolveEntity = async (entityType: any, entityKind: any, gptConversion: GPTConversion)=>{
    const instructions = [
        "Give 'name'/IDs for entities in following rules:",
        `${ABOUT_NAME_ID_GENERATION}`,
        "",
        "Shared Defs Declared:",
        `\`\`\`json
${JSON.stringify(JSON_SCHEMES.$defs, null, 2)}
\`\`\``,
        "",
        "Request: resolve entity item, by following scheme: ",
        `\`\`\`json
${JSON.stringify(safe(JSON_SCHEMES.$entities?.[entityType]), null, 2)}
\`\`\``
    ]?.map?.((instruction)=> instruction?.trim?.());

    //
    // - get items by criteria: `categoriesCache?.find?.((category)=> category?.id === entityType)`
    // - get items by criteria: `categoriesCache?.find?.((category)=> category?.id === usabilityKind?.forEntity)`
    // - get items by criteria: `categoriesCache?.find?.((category)=> category?.id === usabilityKind?.inEntity)`
    // from items caches...

    // temporary items
    const items: any[] = [];

    //
    gptConversion.addToRequest(`
Shortlist of related entities of ${entityType} entity, for making compatible conversion:

\`\`\`json
${JSON.stringify(safe(items?.filter?.((item)=> (item?.kind === entityKind || !entityKind || entityKind === "unknown"))), null, 2)}
\`\`\`
`, null, instructions?.join?.("\n"));



    //
    const response = await gptConversion.sendRequest();
    return JSON.parse(response?.content);
}
