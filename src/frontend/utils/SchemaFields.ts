import { JSON_SCHEMES } from "@rs-core/template/deprecated/Entities";
import { H } from "fest/lure";
import type { FieldSpec } from "@rs-frontend/elements/display/edits/Modal";

//
export type SectionKey = "main" | "description" | "schedule" | "properties" | "contacts" | "relations" | "meta";

export type FieldDescriptor = FieldSpec & {
    path: string;
    section: SectionKey | string;
    multi?: boolean;
    numeric?: boolean;
    json?: boolean;
};

//
export const SECTION_ORDER: SectionKey[] = ["main", "description", "schedule", "properties", "contacts", "relations", "meta"];
export const SECTION_LABELS: Record<string, string> = {
    main: "Main information",
    description: "Description",
    schedule: "Schedule",
    properties: "Properties",
    contacts: "Contacts",
    relations: "Relations",
    meta: "Metadata"
};

//
const LEGACY_FIELD_PATHS: Record<string, string> = {
    title: "title",
    kind: "kind",
    description: "description",
    price: "properties.price",
    quantity: "properties.quantity",
    begin_time: "properties.begin_time",
    end_time: "properties.end_time",
    email: "properties.contacts.email",
    phone: "properties.contacts.phone",
    "contacts.email": "properties.contacts.email",
    "contacts.phone": "properties.contacts.phone"
};

//
export const cloneEntity = <T>(value: T): T => {
    try { return structuredClone(value); }
    catch { return JSON.parse(JSON.stringify(value)); }
};

//
export const startCase = (value: string) =>
    value.replace(/[_\-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^./, (char) => char.toUpperCase());

//
export const splitPath = (path: string) => path.split(".").filter(Boolean);
export const getByPath = (source: any, path: string) => splitPath(path).reduce((acc, key) => (acc == null ? acc : acc[key]), source);

//
export const setByPath = (target: any, path: string, value: any) => {
    const keys = splitPath(path);
    if (!keys.length) return;
    let current = target;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (typeof current[key] !== "object" || current[key] === null) current[key] = {};
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
};

//
export const unsetByPath = (target: any, path: string) => {
    const keys = splitPath(path);
    if (!keys.length) return;
    const parents: Array<[any, string]> = [];
    let current = target;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current?.[key] === undefined) return;
        parents.push([current, key]);
        current = current[key];
        if (typeof current !== "object" || current === null) return;
    }
    const lastKey = keys[keys.length - 1];
    if (current && Object.prototype.hasOwnProperty.call(current, lastKey)) {
        delete current[lastKey];
        for (let i = parents.length - 1; i >= 0; i--) {
            const [parent, key] = parents[i];
            const value = parent[key];
            if (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) delete parent[key];
            else break;
        }
    }
};

//
export const toMultiline = (value: unknown): string => {
    if (!value) return "";
    if (Array.isArray(value)) return value.map((item) => (item ?? "").toString().trim()).filter(Boolean).join("\n");
    return String(value ?? "");
};

//
export const fromMultiline = (value: string): string[] => {
    if (!value) return [];
    return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};

//
const BASE_DESCRIPTORS: FieldDescriptor[] = [
    { name: "title", label: "Title", path: "title", section: "main", placeholder: "Human readable name", helper: "Shown in cards and lists" },
    { name: "kind", label: "Kind", path: "kind", section: "main", placeholder: "e.g. meeting, discount", helper: "Determines category specific behaviour" },
    { name: "description", label: "Description", path: "description", section: "description", textarea: true, helper: "Optional details" },
    { name: "tags", label: "Tags", path: "tags", section: "meta", textarea: true, helper: "One tag per line", multi: true },
    { name: "icon", label: "Icon", path: "icon", section: "meta", placeholder: "Icon id (e.g. phosphor/name)" }
];

//
const CONTACT_DESCRIPTORS: FieldDescriptor[] = [
    { name: "contacts.email", label: "Emails", path: "properties.contacts.email", section: "contacts", textarea: true, helper: "One email per line", multi: true },
    { name: "contacts.phone", label: "Phones", path: "properties.contacts.phone", section: "contacts", textarea: true, helper: "One phone per line", multi: true }
];

type PropertyRule = Partial<FieldDescriptor> & { multi?: boolean; numeric?: boolean; json?: boolean; section?: SectionKey };
const PROPERTY_RULES: Record<string, PropertyRule> = {
    price: { label: "Price", section: "properties", type: "number", numeric: true, helper: "Use dot as decimal separator" },
    quantity: { label: "Quantity", section: "properties", type: "number", numeric: true },
    begin_time: { label: "Begin", section: "schedule", placeholder: "YYYY-MM-DD or HH:MM" },
    end_time: { label: "End", section: "schedule", placeholder: "YYYY-MM-DD or HH:MM" },
    location: { label: "Location", section: "relations", placeholder: "location:type:id" },
    services: { label: "Services", section: "relations", multi: true, helper: "Reference IDs, one per line", textarea: true },
    members: { label: "Members", section: "relations", multi: true, helper: "Reference IDs, one per line", textarea: true },
    actions: { label: "Actions", section: "relations", multi: true, helper: "Action IDs, one per line", textarea: true },
    bonuses: { label: "Bonuses", section: "properties", multi: true, helper: "Bonus IDs, one per line", textarea: true },
    rewards: { label: "Rewards", section: "properties", multi: true, helper: "Reward IDs, one per line", textarea: true },
    feedbacks: { label: "Feedbacks", section: "properties", multi: true, helper: "Feedback IDs, one per line", textarea: true },
    tasks: { label: "Tasks", section: "relations", multi: true, helper: "Task IDs, one per line", textarea: true },
    persons: { label: "Persons", section: "relations", multi: true, helper: "Person IDs, one per line", textarea: true },
    events: { label: "Events", section: "relations", multi: true, helper: "Event IDs, one per line", textarea: true },
    image: { label: "Images", section: "properties", multi: true, helper: "Image URLs, one per line", textarea: true },
    availability: { label: "Availability", section: "properties" },
    availabilityTime: { label: "Availability time", section: "properties", multi: true, textarea: true },
    availabilityDays: { label: "Availability days", section: "properties", multi: true, textarea: true },
    permissions: { label: "Permissions", section: "properties" },
    purpose: { label: "Purpose", section: "properties" },
    home: { label: "Home", section: "relations" },
    jobs: { label: "Jobs", section: "relations", multi: true, helper: "Location IDs, one per line", textarea: true },
    coordinates: { label: "Coordinates", section: "properties", textarea: true, json: true, helper: "JSON object with latitude and longitude" }
};

const descriptorFromSpec = (spec: FieldSpec): FieldDescriptor => {
    const mappedPath = LEGACY_FIELD_PATHS[spec.name] || (spec.name.includes(".") ? spec.name : `properties.${spec.name}`);
    let section: SectionKey | string = "properties";
    if (mappedPath.startsWith("desc.")) {
        section = mappedPath.endsWith("description") ? "description" : "main";
    } else if (mappedPath.startsWith("properties.contacts")) {
        section = "contacts";
    } else if (mappedPath.startsWith("properties.begin_time") || mappedPath.startsWith("properties.end_time")) {
        section = "schedule";
    }
    return {
        ...spec,
        name: spec.name,
        path: mappedPath,
        section,
        multi: spec.textarea ? true : undefined
    };
};

//
const makeObjectEntries = (object: any) => {
    if (!object) return [];
    if (typeof object == "object" || typeof object == "function") {
        return [...Object.entries(object)];
    }
    return [];
}

export const collectDescriptors = (entityType: string, extras: (FieldSpec | null)[], allowLinks: boolean): FieldDescriptor[] => {
    const descriptors = new Map<string, FieldDescriptor>();
    const addDescriptor = (descriptor: FieldDescriptor) => descriptors.set(descriptor.name, descriptor);
    BASE_DESCRIPTORS.forEach(addDescriptor);

    const schema = (JSON_SCHEMES as any)?.$entities?.[entityType] || null;
    if (schema?.kind?.enum) {
        const kindDescriptor = descriptors.get("kind");
        if (kindDescriptor) kindDescriptor.options = schema.kind.enum.map((value: string) => ({ label: startCase(value), value }));
    }

    const properties = schema?.properties ?? {};
    makeObjectEntries(properties).forEach(([propName, propSchema]: [string, any]) => {
        if (propName === "contacts") {
            CONTACT_DESCRIPTORS.forEach(addDescriptor);
            return;
        }
        if (propName === "biography") {
            addDescriptor({ name: "biography.firstName", label: "First name", path: "properties.biography.firstName", section: "main" });
            addDescriptor({ name: "biography.lastName", label: "Last name", path: "properties.biography.lastName", section: "main" });
            addDescriptor({ name: "biography.nickName", label: "Nick name", path: "properties.biography.nickName", section: "main" });
            addDescriptor({ name: "biography.birthdate", label: "Birth date", path: "properties.biography.birthdate", section: "meta", placeholder: "YYYY-MM-DD" });
            addDescriptor({ name: "biography.gender", label: "Gender", path: "properties.biography.gender", section: "meta", options: (propSchema.properties?.gender?.enum ?? []).map((value: string) => ({ label: startCase(value), value })) });
            return;
        }
        const rule = PROPERTY_RULES[propName] ?? {};
        const path = rule.path ?? `properties.${propName}`;
        const name = rule.name ?? path;
        const section = rule.section ?? "properties";
        const descriptor: FieldDescriptor = {
            name,
            path,
            section,
            label: rule.label ?? startCase(propName),
            placeholder: rule.placeholder,
            helper: rule.helper,
            textarea: rule.textarea,
            multi: rule.multi,
            numeric: rule.numeric,
            json: rule.json,
            type: rule.type
        };
        if (descriptor.numeric) descriptor.type = "number";
        else if (!descriptor.type && propSchema?.type === "number") {
            descriptor.type = "number";
            descriptor.numeric = true;
        }
        if (propSchema?.enum && !descriptor.options) descriptor.options = propSchema.enum.map((value: string) => ({ label: startCase(String(value)), value: String(value) }));
        if (propSchema?.type === "array" && descriptor.multi === undefined) {
            descriptor.multi = true;
            descriptor.textarea = true;
        }
        addDescriptor(descriptor);
    });

    extras?.forEach((spec) => {
        if (!spec) return;
        addDescriptor(descriptorFromSpec(spec));
    });

    if (allowLinks && !descriptors.has("links")) {
        addDescriptor({
            name: "links",
            label: "Linked entities",
            path: "properties.links",
            section: "relations",
            textarea: true,
            helper: "One reference per line (type:kind:name)",
            placeholder: "bonus:discount:coffee-card",
            multi: true
        });
    }

    const ordered = Array.from(descriptors.values());
    ordered.sort((a, b) => {
        const orderA = SECTION_ORDER.indexOf(a.section as SectionKey);
        const orderB = SECTION_ORDER.indexOf(b.section as SectionKey);
        if (orderA !== orderB) return (orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA) - (orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB);
        return a.label.localeCompare(b.label);
    });
    return ordered;
};

export const buildInitialValues = (basis: any, descriptors: FieldDescriptor[]) => {
    const values: Record<string, any> = {};
    descriptors.forEach((descriptor) => {
        const raw = getByPath(basis, descriptor.path);
        if (descriptor.json) {
            values[descriptor.name] = raw ? JSON.stringify(raw, null, 2) : "";
            return;
        }
        if (descriptor.multi) {
            values[descriptor.name] = toMultiline(raw);
            return;
        }
        if (descriptor.numeric) {
            values[descriptor.name] = raw === undefined || raw === null ? "" : String(raw);
            return;
        }
        values[descriptor.name] = raw ?? "";
    });
    return values;
};

export const applyDescriptorValues = (basis: any, descriptors: FieldDescriptor[], formValues: Record<string, any>) => {
    const next = cloneEntity(basis ?? {});
    descriptors.forEach((descriptor) => {
        const raw = formValues?.[descriptor.name];
        if (descriptor.multi) {
            const list = Array.isArray(raw) ? raw : fromMultiline(String(raw ?? ""));
            if (list.length) setByPath(next, descriptor.path, list);
            else unsetByPath(next, descriptor.path);
            return;
        }
        if (descriptor.json) {
            const value = typeof raw === "string" ? raw.trim() : "";
            if (value) {
                try { setByPath(next, descriptor.path, JSON.parse(value)); }
                catch { setByPath(next, descriptor.path, value); }
            } else unsetByPath(next, descriptor.path);
            return;
        }
        if (descriptor.numeric) {
            if (raw === "" || raw === null || raw === undefined) unsetByPath(next, descriptor.path);
            else {
                const numberValue = Number(raw);
                if (Number.isNaN(numberValue)) unsetByPath(next, descriptor.path);
                else setByPath(next, descriptor.path, numberValue);
            }
            return;
        }
        if (raw === "" || raw === null || raw === undefined) unsetByPath(next, descriptor.path);
        else setByPath(next, descriptor.path, raw);
    });
    return next;
};

export const ensureSectionHost = (
    modal: { fieldsContainer: HTMLElement },
    sectionNodes: Map<string, HTMLElement>,
    section: string
) => {
    let host = sectionNodes.get(section);
    if (host) return host;
    const title = SECTION_LABELS[section] ?? startCase(section);
    const wrapper = H`<div class="modal-section" data-section=${section}>
        <h4 class="modal-section-title">${title}</h4>
        <div class="modal-section-fields"></div>
    </div>` as HTMLElement;
    modal.fieldsContainer.appendChild(wrapper);
    host = wrapper.querySelector(".modal-section-fields") as HTMLElement;
    sectionNodes.set(section, host);
    return host;
};

export const fieldDescriptorToSpec = (descriptor: FieldDescriptor): FieldSpec => {
    const { path: _path, section: _section, multi: _multi, numeric: _numeric, json: _json, ...spec } = descriptor;
    return spec;
};
