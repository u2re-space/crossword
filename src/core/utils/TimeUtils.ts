import { makeReactive } from "fest/object";

//
export const checkInTimeRange = (beginTime: Date, endTime: Date, currentTime: Date) => {
    // after begins and before ends
    if (beginTime && endTime) { // optional, used for notification or alarm
        return parseAndGetCorrectTime(beginTime) < parseAndGetCorrectTime(currentTime) && parseAndGetCorrectTime(currentTime) < parseAndGetCorrectTime(endTime);
    };
    // after begins
    if (beginTime) { // optional, used for notification or alarm
        return parseAndGetCorrectTime(beginTime) < parseAndGetCorrectTime(currentTime);
    };
    // before ends
    if (endTime) { // optional, used for notification or alarm
        return parseAndGetCorrectTime(currentTime) < parseAndGetCorrectTime(endTime);
    };
    return false;
}

//
export const checkRemainsTime = (beginTime: Date, endTime: Date, currentTime: Date, maxDays: number = 7) => {
    let factorMasked = true;

    // utils begins
    if (beginTime) { // optional, used for notification or alarm
        factorMasked &&= parseAndGetCorrectTime(currentTime) <= parseAndGetCorrectTime(beginTime);
    }

    // utils ends
    if (endTime) { // optional, used for notification or alarm
        factorMasked &&= parseAndGetCorrectTime(currentTime) < parseAndGetCorrectTime(endTime);
    }

    // if maxDays is set, check if the time is within the next maxDays days
    if (maxDays) {
        const dateLimit = parseAndGetCorrectTime(currentTime) + maxDays * 24 * 60 * 60 * 1000;
        factorMasked &&= parseAndGetCorrectTime(beginTime) < parseAndGetCorrectTime(dateLimit);
    }

    //
    return factorMasked;
}

//
export const isDate = (date: any) => {
    const firstStep = date instanceof Date || typeof date == "string" && date.match(/^\d{4}-\d{2}-\d{2}$/);
    let secondStep = false;
    try {
        secondStep = parseAndGetCorrectTime(date) > 0;
    } catch (e) {
        secondStep = false;
    }
    return firstStep && secondStep;
}

//
export const insideOfDay = (item: any, dayDesc: any) => {
    const inRange = (
        parseAndGetCorrectTime(item?.properties?.begin_time) >= parseAndGetCorrectTime(dayDesc?.begin_time) &&
        parseAndGetCorrectTime(item?.properties?.end_time) <= parseAndGetCorrectTime(dayDesc?.end_time)
    );
    const matchesFilter = dayDesc?.filter ? item?.properties?.status == dayDesc?.filter : true;
    return Boolean(inRange && matchesFilter);
}

//
export const notInPast = (item: any, dayDesc?: any) => {
    //return true;
    return parseAndGetCorrectTime(item?.properties?.end_time) >= parseAndGetCorrectTime() || (dayDesc?.filter && item?.properties?.status == dayDesc?.filter);
}

//
export const getISOWeekNumber = (input: Date | null | undefined): number | null => {
    if (!input) return null;
    const target = new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
    const dayNumber = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const createDayDescriptor = (input: Date | null | undefined, partial: Record<string, any> = {}) => {
    if (!input) return null;

    const dayBegin = new Date(input.getTime());
    dayBegin.setHours(0, 0, 0, 0);

    const dayEnd = new Date(input.getTime());
    dayEnd.setHours(23, 59, 59, 999);

    const dayDay = dayBegin.toLocaleDateString("en-US", { day: "numeric" });
    const dayWeekday = dayBegin.toLocaleDateString("en-US", { weekday: "short" });
    const dayMonth = dayBegin.toLocaleDateString("en-US", { month: "short" });
    const dayTitle = `${dayDay} ${dayMonth} ${dayWeekday}`;

    const dayDayForId = dayBegin.toLocaleDateString("en-US", { day: "numeric" });
    const dayMonthForId = dayBegin.toLocaleDateString("en-US", { month: "numeric" });
    const dayYearForId = dayBegin.toLocaleDateString("en-US", { year: "numeric" });
    const dayId = `${dayDayForId}_${dayMonthForId}_${dayYearForId}`;

    const fullDay = dayBegin.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const weekNumber = getISOWeekNumber(dayBegin);
    const separatorTitle = weekNumber ? `${fullDay} · Week ${weekNumber}` : fullDay;

    return {
        id: dayId,
        title: dayTitle,
        begin_time: dayBegin.toISOString(),
        end_time: dayEnd.toISOString(),
        separatorTitle,
        weekNumber,
        ...partial
    };
};

export const SplitTimelinesByDays = async (timelineMap: any, daysDesc: any[] | null = null) => {
    daysDesc ??= makeReactive([] as any[]) as any[];

    //
    if (!timelineMap) return daysDesc;

    // get available days from timelines
    for (const timeline of (await timelineMap) ?? []) {
        if (timeline?.properties?.begin_time && timeline?.properties?.end_time) {
            const beginTime = parseDateCorrectly(timeline?.properties?.begin_time);
            const endTime = parseDateCorrectly(timeline?.properties?.end_time);

            // search same day
            let day = daysDesc?.find?.(day => {
                //day.filter == timeline.status ||
                return parseAndGetCorrectTime(beginTime) >= parseAndGetCorrectTime(day?.begin_time) &&
                    parseAndGetCorrectTime(endTime) <= parseAndGetCorrectTime(day?.end_time);
            }) ?? null;

            // if day not found and isn't past
            if (!day && (parseAndGetCorrectTime(endTime) >= parseAndGetCorrectTime())) {
                // create day (floor and ceiling times into day)
                const dayDescriptor = createDayDescriptor(beginTime, { filter: "" });
                if (dayDescriptor) {
                    daysDesc?.push?.(day ??= dayDescriptor);
                }
            }
        }
    }

    //
    return daysDesc;
}

//
export function isPureHHMM(str: any) {
    if (!str) return false;
    return /^([01]\d|2[0-3]):([0-5]\d)$/?.test?.(String(str)?.trim?.());
}

//
export function parseDateCorrectly(str: any | Date | null = null): Date | null {
    if (!str) return new Date();
    if (str instanceof Date) return new Date(str);
    if (typeof str == "object" && str?.timestamp) { return new Date(str?.timestamp); }
    if (typeof str == "object" && str?.iso_date) { return new Date(str?.iso_date); }
    if (typeof str == "object" && str?.date) { return new Date(str?.date); }
    if (typeof str == "number") {
        const multiplier = Math.pow(10, 11 - (String(str | 0)?.length || 11)) | 0;
        return new Date(str * multiplier);
    }
    if (typeof str == "string" && isPureHHMM(str)) {
        const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(str?.trim?.());
        if (!m) return new Date();
        const [, hh, mm] = m;
        const now = new Date();
        return new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            Number(hh),
            Number(mm),
            0,
            0
        );
    }
    return new Date(str);
}

//
export function parseAndGetCorrectTime(str: any | Date | null = null): number {
    if (!str) return Date.now();
    if (typeof str == "number") {
        const multiplier = Math.pow(10, 11 - (String(str | 0)?.length || 11)) | 0;
        return str * multiplier;
    }
    if (str instanceof Date) return str.getTime();
    return parseDateCorrectly(str)?.getTime?.() ?? Date.now();
}
