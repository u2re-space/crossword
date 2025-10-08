import { stringRef } from "fest/object";
import { H, M, Q } from "fest/lure";

//
const jsonOutputTypeFormat = [
    { value: "iso_date", label: "ISO Date", write_as: { iso_date: "string" } },
    { value: "date", label: "Date String", write_as: { date: "string" } },
    { value: "timestamp", label: "Timestamp String", write_as: { timestamp: "number" } },
    { value: "text", label: "Plain Date String", write_as: "string" },
    { value: "number", label: "Plain Timestamp", write_as: "number" },
];

//
const FIND_BY_EXISTS = (date: any) => {
    if (typeof date == "string") return "text";
    if (typeof date == "number") return "timestamp";
    if (typeof date == "object") {
        switch (Object.keys(date)?.[0]) {
            case "iso_date": return "iso_date";
            case "date": return "date";
            case "timestamp": return "timestamp";
            case "text": return "text";
            case "number": return "number";
            default: return "iso_date";
        }
    }
    return "iso_date";
};

//
const iconsBy = {
    iso_date: "calendar-check",
    date: "calendar",
    timestamp: "clock",
    text: "calendar-check",
    number: "clock",
};

//
interface FieldWithKey {
    key: string;
    field: any;
};

//
interface ObjectAndKey {
    object?: any | null;
    key?: string | null;
};

//
const editBindings = new WeakMap<any, FieldWithKey>();
const whichUsed = new WeakMap<any, ObjectAndKey>();

//
const BY_FORMAT = (format: string, value: Date | null) => {
    if (!value) return { iso_date: "" };
    if (format == "iso_date") return { iso_date: value?.toISOString() };
    if (format == "date") return { date: value?.toLocaleDateString() };
    if (format == "timestamp") return { timestamp: value?.getTime() };
    if (format == "text") return value?.toLocaleDateString();
    return { timestamp: value?.getTime() };
}

// Please, validate a time format! Okay, wait for the next version of the editor...
const VALIDATE = (value: Date | string | number | object | null, format?: string | null) => {
    if (value instanceof Date) {
        if (!value) return false;
        if (value.getTime() < 0) return false;
        return true;
    } else {
        if (!format) return false;
        if (typeof value == "string") {
            if (!value) return false;
            return true;
        }
        if (typeof value == "number") {
            if (!value) return false;
            return true;
        }
        if (typeof value == "object") {
            if (!value) return false;
            if (Object.keys(value).length == 0) return true;
            return true;
        }
    }
};

//
// looks like date picker with button, where drops menu of formats
// later I describe in detail, in SCSS styles
//

//
export const DateEntryEdit = ({ object, key }: ObjectAndKey) => {
    if (!key) return { block: null, saveEvent: () => { } };

    //
    const refEl = Q(($h) => $h);
    const rifEl = Q(($h) => $h);

    //
    const dynamicIcon = stringRef("arrow-right");
    const selectedFormat = stringRef(FIND_BY_EXISTS(object[key] ?? {}));

    // TODO: dynamic icons support...
    const block = H`<div class="date-field-layout" data-key=${key}>
<div class="date-field-layout-input"><input ref=${rifEl} type="datetime-local" prop:valueAsDate=${new Date(object[key]?.iso_date ?? object[key]?.date ?? object[key]?.timestamp ?? object[key])} data-invalid=${!VALIDATE(new Date(object[key]?.iso_date ?? object[key]?.date ?? object[key]?.timestamp ?? object[key]))} /></div>
<label aria-hidden="true">JSON Output Type Format</label><ui-icon icon=${dynamicIcon}></ui-icon>
<select ref=${refEl} prop:value=${selectedFormat}>
    ${M(jsonOutputTypeFormat, (item) => H`<option value=${item.value}>${item.label}</option>`)}
</select>
</div>`

    // on save event
    const saveEvent = (value: Date | null) => {
        if (VALIDATE(value, refEl.value)) {
            object[key] = { [refEl.value]: BY_FORMAT(refEl.value, value) };
        }
    }

    //
    rifEl?.addEventListener("change", (ev) => {
        if (VALIDATE(rifEl?.valueAsDate, refEl.value)) { saveEvent(rifEl?.valueAsDate); }
    });

    //
    refEl?.addEventListener("change", (ev) => {
        selectedFormat.value = ev.target.value;
        dynamicIcon.value = iconsBy[ev.target.value];
        saveEvent(rifEl?.valueAsDate);
    });

    //
    whichUsed.set(block, { key, object });
    editBindings.set(object, { key, field: new WeakRef(block) });
    return { block, saveEvent };
}

//
export default DateEntryEdit;
