import { isDate } from "@rs-core/utils/TimeUtils";
import { makeReactive } from "fest-src/fest/object/index";

//
export const SplitTimelinesByDays = async (timelineMap: any, daysDesc: any[] | null = null) => {
    daysDesc ??= makeReactive([] as any[]) as any[];

    //
    if (!timelineMap) return daysDesc;

    // get available days from timelines
    for (const timeline of (await timelineMap) ?? []) {
        if (timeline?.properties?.begin_time && timeline?.properties?.end_time) {
            const beginTime = new Date(timeline?.properties?.begin_time);
            const endTime = new Date(timeline?.properties?.end_time);
            const TODAY = new Date();

            // search same day
            let day = daysDesc?.find?.(day => {
                return beginTime >= new Date(day?.properties?.begin_time) && endTime <= new Date(day?.properties?.end_time);
            }) ?? null;

            // if day not found and isn't past
            if (!day && (endTime >= TODAY || !isDate(endTime))) {
                daysDesc?.push?.(day ??= {
                    id: isDate(beginTime) ? beginTime.toISOString()?.split?.("T")?.[0] : (beginTime || "unknown"),
                    title: isDate(beginTime) ? beginTime.toISOString()?.split?.("T")?.[0] : (beginTime || "unknown"),
                    properties: { begin_time: beginTime || "unknown", end_time: endTime || "unknown" }
                });
            }
        }
    }

    //
    return daysDesc;
}
