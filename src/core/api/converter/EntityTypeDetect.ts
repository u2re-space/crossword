import type { GPTConversion } from '../endpoints/GPT-Conversion';
import { JSON_SCHEMES } from '../../model/Entities';
import { ASK_WRITE_JSON_FORMAT } from '../endpoints/GPT-Config';

// for optimize images before sending to GPT
import { decode } from '@jsquash/png';
import { encode } from '@jsquash/jpeg';

// for optimize images before sending to GPT
export const convertImageToJPEG = async (image: Blob|File|any): Promise<Blob>=>{
    const decoded = await decode(await image.arrayBuffer());
    const encoded = await encode(decoded, { quality: 90, progressive: false, color_space: 2, optimize_coding: true, auto_subsample: true, arithmetic: true, baseline: true });
    return new Blob([encoded], { type: 'image/jpeg' });
}

//
export const recognizeEntityType = async (dataSource: string|Blob|File|any, gptConversion: GPTConversion)=>{
    const instructions = [
        "You are a helpful assistant that can recognize type of entity. You are given a data source and you need to recognize type of entity. Give in JSON format '{ entityType: string }'. " + ASK_WRITE_JSON_FORMAT,
        "Select only from these entity types: " + JSON.stringify(Object.keys(JSON_SCHEMES.$entities), null, 2) + ", otherwise 'unknown'."
    ]?.map?.((instruction)=> instruction?.trim?.());

    //
    gptConversion.addInstruction(instructions?.join?.("\n"));
    gptConversion.addToRequest(dataSource?.type?.startsWith?.("image/") ? await convertImageToJPEG(dataSource) : dataSource);
    const response = await gptConversion.sendRequest(), $PRIMARY = JSON.parse(response?.content || "{}");
    return $PRIMARY?.entityType || "unknown";
}
