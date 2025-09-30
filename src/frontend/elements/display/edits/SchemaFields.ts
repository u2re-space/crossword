import {
    SectionKey,
    EntityFieldRule,
    BASE_ENTITY_FIELD_RULES,
    ENTITY_SCHEMAS,
    FIELD_ALIASES,
    LEGACY_PROPERTY_RULES
} from "@rs-core/template/EntitiesSchema";
import { H } from "fest/lure";
import type { FieldSpec } from "@rs-frontend/elements/display/edits/Modal";

export type { SectionKey } from "@rs-core/template/EntitiesSchema";

export type FieldDescriptor = FieldSpec & {
    path: string;
    section: SectionKey | string;
    multi?: boolean;
    numeric?: boolean;
    json?: boolean;
};

export const SECTION_ORDER: SectionKey[] = ["main", "schedule", "properties", "contacts", "relations", "meta"];
export const SECTION_LABELS: Record<string, string> = {
    main: "Main information",
    schedule: "Schedule",
    properties: "Properties",
    contacts: "Contacts",
    relations: "Relations",
    meta: "Metadata"
};

const DEFAULT_SECTION: SectionKey = "properties";

export const cloneEntity = <T>(value: T): T => {
    try {
        return structuredClone(value);
    } catch {
        return JSON.parse(JSON.stringify(value));
    }
};

export const startCase = (value: string) =>
    value.replace(/[_\-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^./, (char) => char.toUpperCase());

export const splitPath = (path: string) => path.split(".").filter(Boolean);

export const getByPath = (source: any, path: string) => splitPath(path).reduce((acc, key) => (acc == null ? acc : acc[key]), source);

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

export const toMultiline = (value: unknown): string => {
    if (!value) return "";
    if (Array.isArray(value)) return value.map((item) => (item ?? "").toString().trim()).filter(Boolean).join("\n");
    return String(value ?? "");
};

export const fromMultiline = (value: string): string[] => {
    if (!value) return [];
    return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};

const toOptionList = (options?: string[]): FieldSpec["options"] => {
    if (!options || !options.length) return undefined;
    return options.map((value) => ({ label: startCase(value), value }));
};

const resolveSection = (path: string, fallback: SectionKey | string = DEFAULT_SECTION): SectionKey | string => {
    if (path === "title" || path === "name" || path === "id" || path === "kind" || path === "description") return "main";
    if (path === "variant" || path === "icon" || path === "image" || path === "tags") return "meta";
    if (path.startsWith("properties.begin_time") || path.startsWith("properties.end_time") || path.includes(".timestamp")) return "schedule";
    if (path.includes(".contacts.")) return "contacts";
    if (path.startsWith("properties.links") || path.includes(".tasks") || path.includes(".events") || path.includes(".members") || path.includes(".services") || path.includes(".persons") || path.includes(".actions") || path.includes(".rewards") || path.includes(".bonuses") || path.includes(".related") || path.includes(".usable")) {
        return "relations";
    }
    return fallback;
};

const normalizeScheduleValue = (value: any) => {
    if (!value) return {};
    if (typeof value === "object") return value;
    const text = String(value);
    const timestamp = Number(text);
    if (!Number.isNaN(timestamp) && timestamp > 0) {
        return { timestamp };
    }
    return { iso_date: text };
};

const ruleToDescriptor = (rule: EntityFieldRule): FieldDescriptor => {
    const label = rule.label ?? startCase(rule.name.split(".").pop() ?? rule.name);
    const path = rule.path ?? FIELD_ALIASES[rule.name] ?? (rule.name.includes(".") ? rule.name : `properties.${rule.name}`);
    const section = rule.section ?? resolveSection(path);
    const textarea = Boolean(rule.textarea || rule.json);
    const descriptor: FieldDescriptor = {
        name: rule.name,
        label,
        path,
        section,
        helper: rule.helper,
        placeholder: rule.placeholder,
        textarea,
        multi: rule.multi ?? (textarea ? true : undefined),
        numeric: rule.numeric,
        json: rule.json,
        type: rule.type ?? (rule.numeric ? "number" : undefined),
        options: toOptionList(rule.options),
        datalist: rule.datalist,
        required: rule.required
    };
    return descriptor;
};

const descriptorFromSpec = (spec: FieldSpec): FieldDescriptor => {
    const rule = LEGACY_PROPERTY_RULES[spec.name];
    if (rule) {
        const descriptor = ruleToDescriptor(rule);
        descriptor.label = spec.label ?? descriptor.label;
        descriptor.placeholder = spec.placeholder ?? descriptor.placeholder;
        descriptor.helper = spec.helper ?? descriptor.helper;
        descriptor.options = spec.options ?? descriptor.options;
        descriptor.textarea = spec.textarea ?? descriptor.textarea;
        descriptor.multi = spec.multi ?? descriptor.multi ?? (descriptor.textarea ? true : undefined);
        descriptor.type = spec.type ?? descriptor.type;
        descriptor.required = spec.required ?? descriptor.required;
        descriptor.datalist = spec.datalist ?? descriptor.datalist;
        if (spec.type === "number") descriptor.numeric = true;
        return descriptor;
    }
    const mappedPath = FIELD_ALIASES[spec.name] || (spec.name.includes(".") ? spec.name : `properties.${spec.name}`);
    const section = resolveSection(mappedPath);
    const descriptor: FieldDescriptor = {
        ...spec,
        name: spec.name,
        label: spec.label ?? startCase(spec.name.split(".").pop() ?? spec.name),
        path: mappedPath,
        section,
        multi: spec.multi ?? (spec.textarea ? true : undefined),
        numeric: spec.type === "number" ? true : undefined
    };
    return descriptor;
};

const LINKS_RULE: EntityFieldRule = {
    name: "links",
    label: "Linked entities",
    path: "properties.links",
    section: "relations",
    textarea: true,
    helper: "One reference per line (type:kind:name)",
    multi: true
};

export const collectDescriptors = (entityType: string, extras: (FieldSpec | null)[], allowLinks: boolean): FieldDescriptor[] => {
    const descriptors = new Map<string, FieldDescriptor>();
    const addDescriptor = (descriptor: FieldDescriptor) => descriptors.set(descriptor.name, descriptor);

    BASE_ENTITY_FIELD_RULES.forEach((rule) => addDescriptor(ruleToDescriptor(rule)));

    const schema = ENTITY_SCHEMAS[entityType];
    if (schema?.kind?.length) {
        const kindDescriptor = descriptors.get("kind");
        const options = toOptionList(schema.kind);
        if (kindDescriptor) kindDescriptor.options = options;
        else addDescriptor(ruleToDescriptor({ name: "kind", label: "Kind", path: "kind", section: "main", options: schema.kind }));
    }

    schema?.fields.forEach((rule) => addDescriptor(ruleToDescriptor(rule)));

    if (!schema) {
        Object.values(LEGACY_PROPERTY_RULES).forEach((rule) => {
            if (!descriptors.has(rule.name)) addDescriptor(ruleToDescriptor(rule));
        });
    }

    extras?.forEach((spec) => {
        if (!spec) return;
        addDescriptor(descriptorFromSpec(spec));
    });

    if (allowLinks && !descriptors.has("links")) addDescriptor(ruleToDescriptor(LINKS_RULE));

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
                try {
                    setByPath(next, descriptor.path, JSON.parse(value));
                } catch {
                    if (descriptor.path.includes("begin_time") || descriptor.path.includes("end_time")) {
                        setByPath(next, descriptor.path, normalizeScheduleValue(value));
                    } else {
                        setByPath(next, descriptor.path, value);
                    }
                }
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
    const { path: _path, section: _section, multi: _multi, numeric: _numeric, json: _json, ...rest } = descriptor;
    const baseSpec: FieldSpec = { ...rest };
    if (_numeric) baseSpec.type = baseSpec.type ?? "number";
    return baseSpec;
};
