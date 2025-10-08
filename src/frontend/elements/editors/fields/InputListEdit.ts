// similar to DescriptorEdit, but use input[type="@N"]
import { computed, makeReactive, propRef } from "fest/object";
import { H, M, Q } from "fest/lure";

//
const editBindings = new WeakMap<any, FieldWithKey>();
const whichUsed = new WeakMap<any, ObjectAndKey>();

//
interface FieldWithKey {
    key: string;
    field: any;
};

//
interface ObjectAndKey {
    object: any;
    key: string;
};

//
interface FieldDescription {
    label: string;
    type: string;

    // custom format function
    format?: ((value: any) => any);
};

//
const HTMLInputTypeByVirtualType = new Map<string, string>();
HTMLInputTypeByVirtualType.set("phone", "tel");
HTMLInputTypeByVirtualType.set("email", "email");
HTMLInputTypeByVirtualType.set("url", "url");

//
const formattingRegistry = new Map<string, (value: any) => any>();
const formatPhoneString = (phone: string) => { return phone.replace(/\+7/g, '8').replace(/\s+/g, '').replace(/[^0-9]/g, ''); }
const formatEmailString = (email: string) => { return email.trim(); }
const formatUrlString = (url: string) => { return url.trim(); }

// default formatting functions
formattingRegistry.set("phone", formatPhoneString);
formattingRegistry.set("email", formatEmailString);
formattingRegistry.set("url", formatUrlString);

//
const URL_BY_TYPE = (value: any, description: FieldDescription) => {
    switch (description?.type ?? "text") {
        case "phone":
            return `tel:${value}`;
        case "email":
            return `mailto:${value}`;
        case "url":
            return value;
    }
    return `https://${value}`;
}

//
const IS_URL = (value: any) => {
    if (URL.canParse(value, location.origin)) return true;
    return (value.startsWith("http") || value.startsWith("//") || value.startsWith("www.") || value.startsWith("mailto:") || value.startsWith("tel:") || value.startsWith("https:") || value.startsWith("ftp:") || value.startsWith("file:") || value.startsWith("data:"));
}

//
const FORMAT_AS_URL = (value: any, description: FieldDescription) => {
    // needs protocol specifics...
    const un_url = (description?.format ?? formattingRegistry.get(description?.type ?? "text"))?.(value) ?? value;
    return IS_URL(un_url) ? un_url : URL_BY_TYPE(un_url, description);
};

//
export const DescriptorEdit = (object: any, key?: string | null, parts?: any[] | any, description?: FieldDescription) => {
    description ??= { label: "Part", type: "text" };
    parts ??= makeReactive([]) as string[];

    // AI, remain as function, in future may be needed...
    const loadIfNotExists = () => {
        // if key is presented and object has key, and parts is empty, push the value to parts
        if (key != null && object?.[key] != null && parts?.length <= 0) {
            // TODO: make better idea...
            if (Array.isArray(object[key])) {
                parts?.push(...object[key].map((item) => {
                    if (typeof item == "object" && (item != null || "value" in item)) { return item.value; } else
                        return String(item);
                }));
            } else
                if (typeof object[key] == "object" && (object[key] != null || "value" in object[key])) {
                    parts?.push(object[key].value);
                } else
                    parts?.push(object[key]);
        }
    }

    //
    loadIfNotExists();

    //
    const onChangeEv = (ev: any) => {
        // alternatively, can be used index of child-list element...
        const rawValue = ev.target.value;
        const value = (description?.format ?? formattingRegistry.get(description?.type ?? "text"))?.(rawValue) ?? rawValue;
        saveEvent(value, parseInt(ev.target.dataset.index ?? "-1"));
    }

    // if parts is just string, when adding part changes to array of strings
    const onPreviewEv = (ev: any) => {
        if (ev.target.tagName == "A") {
            ev.target.href = FORMAT_AS_URL(parts[parseInt(ev.target.dataset.index ?? "-1")], description);

            // DAMN, don't recurse and stuck browser to loops, if event is already is clicked...
            //ev.target.click();
        }
    }

    //
    const onCheckboxEv = (ev: any) => {
        if (ev.target.tagName == "INPUT") {
            ev.target.checked = !ev.target.checked;
        }
    }

    //
    const $partRender = (part, index) => H`<div class="descriptor-edit-part" data-index=${index} style=${{ order: index, "--index": index }}><input
        name=${"part-" + index}
        on:change=${onChangeEv}
        prop:value=${propRef(parts, index)}
        data-index=${index}
        type=${HTMLInputTypeByVirtualType.get(description?.type ?? "text") ?? "text"}
        data-format=${description?.type ?? "text"}
        value=${(description?.format ?? formattingRegistry.get(description?.type ?? "text"))?.(part) ?? part}
    ></input><label aria-hidden="true" for=${"part-" + index}>${description?.label ?? "Part"}</label>
    <a aria-hidden="true" ref=${aRefEl} on:click=${onPreviewEv} data-type="preview" data-index=${index} href=${computed(propRef(parts, index), (v) => FORMAT_AS_URL(v, description))} target="_blank">${propRef(parts, index)}</a>
    <input type="checkbox" name=${"show-part-" + index} on:change=${onCheckboxEv} data-index=${index} data-type="show-password-or-url"></input>
    </div>`;

    //
    const aRefEl = Q(($a) => $a);
    const block = H`<div class="descriptor-edit" data-type=${description?.type ?? "text"}>
        ${M(parts, $partRender)}
        <button>Add ${description?.label ?? "Part"}</button>
    </div>`

    //
    const saveEvent = (value: any, index: number) => {
        // possible, reactive value or DOM element
        if (typeof value == "object" && (value != null || "value" in value)) { value = value.value; } else

            // possibly, JSON string
            if (typeof value == "object" && value != null) value = JSON.stringify(value);

        // debug input value and index
        console.log("saveEvent", value, index);

        // if multi-part
        if (index !== -1 && Array.isArray(parts)) {
            if (typeof parts[index] == "string") { parts[index] = value; }
            if (typeof parts[index] == "object" && (parts[index] != null || "value" in parts[index])) { parts[index].value = value; }
        } else
            // currently, no scenario, if index is -1 and parts is array, so...
            if (!Array.isArray(parts)) {
                if (typeof parts == "object" && (parts != null || "value" in parts)) {
                    parts.value = value;
                } else // we no able to reassign primitive value. So, save to object, if presented. Or we do nothing.
                    if (key != null) { object[key] = value; }
            }
    }

    // add part event
    const addPartEvent = () => { parts.value = [...parts.value, ""]; }

    //
    block?.addEventListener("click", (ev) => {
        if (ev.target.tagName == "BUTTON") { addPartEvent(); }
        if (ev.target.tagName == "INPUT") {
            saveEvent(ev.target.value, parseInt(ev.target.dataset.index ?? "-1"));
        }
    });

    //
    whichUsed.set(block, { key: key ?? "", object });
    editBindings.set(object, { key: key ?? "", field: new WeakRef(block) });
    return { block, saveEvent, addPartEvent };
};
