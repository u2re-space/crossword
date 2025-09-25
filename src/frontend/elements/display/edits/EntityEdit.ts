import { H, remove, removeFile } from "fest/lure";
import { writeFileSmart } from "@rs-core/workers/FileSystem";
import { suggestShortNames } from "@rs-frontend/utils/Links";
import { ModalForm, type FieldSpec } from "./Modal";
import {
    collectDescriptors,
    buildInitialValues,
    applyDescriptorValues,
    ensureSectionHost,
    cloneEntity
} from "@rs-frontend/utils/SchemaFields";

//
export type EntityEditOptions = {
    allowLinks?: boolean;
    description?: string;
    submitLabel?: string;
    initialLinks?: string[] | string;
    onLinksChange?: (links: string[]) => void;
    entityType?: string;
};

type SectionKey = "main" | "description" | "schedule" | "properties" | "contacts" | "relations" | "meta";

type FieldDescriptor = FieldSpec & {
    path: string;
    section: SectionKey | string;
    multi?: boolean;
    numeric?: boolean;
    json?: boolean;
};

const SECTION_ORDER: SectionKey[] = ["main", "description", "schedule", "properties", "contacts", "relations", "meta"];
const SECTION_LABELS: Record<string, string> = {
    main: "Main information",
    description: "Description",
    schedule: "Schedule",
    properties: "Properties",
    contacts: "Contacts",
    relations: "Relations",
    meta: "Metadata"
};

const LEGACY_FIELD_PATHS: Record<string, string> = {
    title: "desc.title",
    "desc.title": "desc.title",
    kind: "kind",
    description: "desc.description",
    "desc.description": "desc.description",
    price: "properties.price",
    quantity: "properties.quantity",
    begin_time: "properties.begin_time",
    end_time: "properties.end_time",
    email: "properties.contacts.email",
    phone: "properties.contacts.phone",
    "contacts.email": "properties.contacts.email",
    "contacts.phone": "properties.contacts.phone"
};

const startCase = (value: string) =>
    value.replace(/[_\-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^./, (char) => char.toUpperCase());

const splitPath = (path: string) => path.split(".").filter(Boolean);
const getByPath = (source: any, path: string) => splitPath(path).reduce((acc, key) => (acc == null ? acc : acc[key]), source);
const setByPath = (target: any, path: string, value: any) => {
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
const unsetByPath = (target: any, path: string) => {
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

const toMultiline = (value: unknown): string => {
    if (!value) return "";
    if (Array.isArray(value)) return value.map((item) => (item ?? "").toString().trim()).filter(Boolean).join("\n");
    return String(value ?? "");
};
const fromMultiline = (value: string): string[] => {
    if (!value) return [];
    return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};

const BASE_DESCRIPTORS: FieldDescriptor[] = [
    { name: "desc.title", label: "Title", path: "desc.title", section: "main", placeholder: "Human readable name", helper: "Shown in cards and lists" },
    { name: "kind", label: "Kind", path: "kind", section: "main", placeholder: "e.g. meeting, discount", helper: "Determines category specific behaviour" },
    { name: "desc.description", label: "Description", path: "desc.description", section: "description", textarea: true, helper: "Optional details" },
    { name: "desc.tags", label: "Tags", path: "desc.tags", section: "meta", textarea: true, helper: "One tag per line", multi: true },
    { name: "desc.icon", label: "Icon", path: "desc.icon", section: "meta", placeholder: "Icon id (e.g. phosphor/name)" }
];
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

const fieldDescriptorToSpec = (descriptor: FieldDescriptor): FieldSpec => {
    const { path: _path, section: _section, multi: _multi, numeric: _numeric, json: _json, ...spec } = descriptor;
    return spec;
};

export const makeEntityEdit = async (
    label: string,
    fields: (FieldSpec | null)[],
    basis: any = {},
    options: EntityEditOptions = {}
): Promise<Record<string, any> | null> => {
    const entityType = (options.entityType || basis?.type || label || "").toString().toLowerCase();
    const descriptors = collectDescriptors(entityType, fields, Boolean(options.allowLinks));
    const initialValues = buildInitialValues(basis, descriptors);

    return new Promise((resolve) => {
        const modal = ModalForm(`Edit ${label}`, async (out) => {
            if (!out) {
                resolve(null);
                return;
            }
            const applied = applyDescriptorValues(basis, descriptors, out as Record<string, any>);
            resolve(applied);
        }, {
            description: options.description,
            submitLabel: options.submitLabel
        });

        const sectionHosts = new Map<string, HTMLElement>();
        descriptors.forEach((descriptor) => {
            const host = ensureSectionHost(modal, sectionHosts, descriptor.section);
            const field = modal.addField(fieldDescriptorToSpec(descriptor), initialValues[descriptor.name], host);
            if (descriptor.multi && field) field.dataset.multiline = "true";
            if (descriptor.numeric && field) field.dataset.numeric = "true";
        });

        if (options.allowLinks) {
            const linkField = modal.fieldsContainer.querySelector<HTMLTextAreaElement>('textarea[name="links"]');
            if (linkField) {
                const sync = () => {
                    const links = linkField.value
                        .split(/[\n,;,]+/)
                        .map((chunk) => chunk.trim())
                        .filter(Boolean);
                    options.onLinksChange?.(links);
                };
                linkField.addEventListener('input', sync);
                if (Array.isArray(options.initialLinks)) linkField.value = options.initialLinks.join("\n");
                else if (typeof options.initialLinks === "string") linkField.value = options.initialLinks;

                requestAnimationFrame(async () => {
                    const suggestions = await suggestShortNames();
                    if (!suggestions.length) return;
                    const datalist = document.createElement('datalist');
                    datalist.id = 'links-suggestions';
                    suggestions.forEach((opt: any) => {
                        const option = document.createElement('option');
                        option.value = typeof opt === 'string' ? opt : opt.value;
                        if (typeof opt !== 'string' && opt.label) option.label = opt.label;
                        datalist.appendChild(option);
                    });
                    linkField.setAttribute('list', datalist.id);
                    linkField.parentElement?.appendChild(datalist);
                });
            }
        }

        modal.focusFirst();
    });
};

//
export const objectExcludeNotExists = (object: any) => {
    return Object.fromEntries([...Object.entries(object)].filter(([key, value]) => value !== null && value !== undefined));
}

//
export const makeEvents = (label: string, path: string, title: string, basis: any, kind: string) => {
    return {
        doDelete: async (ev: Event) => {
            ev?.stopPropagation?.();
            if (!confirm(`Delete ${label} "${title}"?`)) return;

            try { await removeFile(null, path); } catch (e) { console.warn(e); }

            const fileId = basis?.id || basis?.name || basis?.desc?.name;
            const card = document.querySelector(`.card[data-id="${fileId}"]`);
            card?.remove?.();
        },
        doEdit: async (ev: Event) => {
            ev?.stopPropagation?.();

            const entityType = (basis?.type || label || "").toString().toLowerCase();
            const result = await makeEntityEdit(label, [], basis, {
                allowLinks: true,
                entityType
            });
            if (!result) return;

            const updated = cloneEntity(result);
            Object.assign(basis, updated);
            if (updated.desc) basis.desc = updated.desc;
            if (updated.properties) basis.properties = updated.properties;

            const fileId = basis?.id || basis?.name || basis?.desc?.name;

            try {
                const fileName = (path?.split?.('/')?.pop?.() || `${fileId}.json`).replace(/\s+/g, '-');
                const fileDir = path?.split?.('/')?.slice(0, -1)?.join?.('/') + (path?.endsWith?.('/') ? '' : '/');
                const file = new File([JSON.stringify(updated, null, 2)], fileName, { type: 'application/json' });
                await writeFileSmart(null, fileDir, file, { ensureJson: true });
            } catch (e) { console.warn(e); }

            const card = document.querySelector(`.card[data-id="${fileId}"]`);
            if (basis?.desc?.title) {
                card?.querySelector?.('.card-title li')?.replaceChildren?.(document.createTextNode(basis.desc.title));
            }
            if (basis?.desc?.description) {
                card?.querySelector?.('.card-desc li')?.replaceChildren?.(document.createTextNode(basis.desc.description));
            }
            if (basis?.properties?.begin_time && basis?.properties?.end_time) {
                card?.querySelector?.('.card-time li')?.replaceChildren?.(document.createTextNode(`${basis.properties.begin_time} - ${basis.properties.end_time}`));
            }
        }
    }
}
