import type { TimeType } from "@rs-core/template/EntityInterface";

//
export interface DayDescriptor {
    begin_time?: TimeType | Date | string | null;
    end_time?: TimeType | Date | string | null;
    status?: string | null;

    // less usual fields
    id?: string | null;
    title?: string | null;
    separatorTitle?: string | null;
    weekNumber?: number | null;
}

//
export type ChapterDescriptor = DayDescriptor | TimeType | string | null;

//
export interface EntityDescriptor {
    type: string;
    label: string;
    DIR: string;
}
