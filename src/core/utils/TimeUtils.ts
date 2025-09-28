//
export const checkInTimeRange = (beginTime: Date, endTime: Date, currentTime: Date) => {
    // after begins and before ends
    if (beginTime && endTime) {
        return new Date(beginTime) < currentTime && currentTime < new Date(endTime);
    }
    // after begins
    if (beginTime) {
        return new Date(beginTime) < currentTime;
    }
    // before ends
    if (endTime) {
        return currentTime < new Date(endTime);
    }
    return false;
}

//
export const checkRemainsTime = (beginTime: Date, endTime: Date, currentTime: Date) => {
    // utils begins and before ends
    if (beginTime && endTime) {
        return new Date(beginTime) > currentTime && currentTime < new Date(endTime);
    }
    // utils begins
    if (beginTime) {
        return new Date(beginTime) > currentTime;
    }
    // before ends
    if (endTime) {
        return currentTime < new Date(endTime);
    }
    return false;
}

//
export const isDate = (date: any) => {
    const firstStep = date instanceof Date || typeof date == "string" && date.match(/^\d{4}-\d{2}-\d{2}$/);
    let secondStep = false;
    try {
        secondStep = new Date(date).getTime() > 0;
    } catch (e) {
        secondStep = false;
    }
    return firstStep && secondStep;
}

//
export const insideOfDay = (item: any, dayDesc: any) => {
    return (
        new Date(item.properties?.begin_time) >= new Date(dayDesc.properties?.begin_time) &&
        new Date(item.properties?.end_time) <= new Date(dayDesc.properties?.end_time)
    ) || (!isDate(item.properties?.begin_time) || !isDate(item.properties?.end_time));
}
