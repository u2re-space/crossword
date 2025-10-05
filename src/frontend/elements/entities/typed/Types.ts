import type { TimeType } from "@rs-core/template/EntityInterface";

//
export interface DayDescriptor {
    begin_time?: TimeType | Date | null;
    end_time?: TimeType | Date | null;
    status?: string | null;
}

//
export type ChapterDescriptor = DayDescriptor | string;

//
export interface EntityDescriptor {
    type: string;
    label: string;
    DIR: string;
}
