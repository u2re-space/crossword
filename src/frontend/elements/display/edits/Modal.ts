import { H } from "fest/lure";

//
export type FieldOption = string | { label: string; value: string; description?: string };
export type FieldSpec = {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    helper?: string;
    required?: boolean;
    textarea?: boolean;
    options?: FieldOption[];
    multi?: boolean;
    datalist?: (FieldOption | string)[];
    min?: number | string;
    max?: number | string;
    step?: number | string;
    pattern?: string;
    autoComplete?: string;
};

//
type ModalResult = Record<string, any> | null;

export type ModalHandle = {
    form: HTMLFormElement;
    close: () => void;
    addField: (spec: FieldSpec, value?: any, host?: HTMLElement) => HTMLElement | null;
    addFields: (specs: (FieldSpec | null | undefined)[], initial?: Record<string, any>, host?: HTMLElement) => void;
    focusFirst: () => void;
    setBusy: (busy: boolean) => void;
    setValue: (name: string, value: any) => void;
    getValue: (name: string) => any;
    setOptions?: (name: string, options: FieldOption[]) => void;
    fieldsContainer: HTMLElement;
    actionsContainer: HTMLElement;
};

type ModalOptions = {
    description?: string;
    submitLabel?: string;
    cancelLabel?: string;
    allowBackdropClose?: boolean;
};

type FieldEntry = {
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    spec: FieldSpec;
};

const normalizeOption = (option: FieldOption): { label: string; value: string; description?: string } => {
    if (typeof option === "string") {
        return { label: option, value: option };
    }
    return option;
};

const slugId = (name: string) => `${name}-${Math.random().toString(36).slice(2, 8)}`;

export const ModalForm = (
    title: string,
    resolve: (result: ModalResult) => void,
    options: ModalOptions = {}
): ModalHandle => {
    const {
        description,
        submitLabel = "Save",
        cancelLabel = "Cancel",
        allowBackdropClose = true
    } = options;

    let resolved = false;
    let busy = false;
    const entries = new Map<string, FieldEntry>();

    const handleResolve = (out: ModalResult) => {
        if (resolved) return;
        resolved = true;
        resolve(out);
    };

    const close = () => {
        if (busy) return;
        backdrop?.remove?.();
    };

    const gatherValue = ({ element, spec }: FieldEntry) => {
        if (element instanceof HTMLSelectElement) {
            if (spec.multi || element.multiple) {
                return Array.from(element.selectedOptions).map((opt) => opt.value);
            }
            return element.value;
        }
        if (element instanceof HTMLTextAreaElement) {
            return element.value;
        }
        if (element.type === "checkbox") {
            return element.checked;
        }
        if (element.type === "number" || element.type === "range") {
            return element.value !== "" ? Number(element.value) : "";
        }
        return element.value;
    };

    const confirm = (ev: SubmitEvent | HTMLFormElement | null) => {
        ev?.preventDefault?.();
        if (busy) return;
        const out: Record<string, any> = {};
        entries.forEach((entry, name) => {
            out[name] = gatherValue(entry);
        });
        handleResolve(out);
        close();
    };

    const form = H`<form class="modal-form" on:submit=${confirm}>
        <h3 class="modal-title">${title}</h3>
        ${description ? H`<p class="modal-description">${description}</p>` : null}
        <div class="modal-fields"></div>
        <div class="modal-actions">
            <div class="modal-actions-left"></div>
            <div class="modal-actions-right">
                <button type="button" class="btn cancel">
                    <ui-icon icon="x"></ui-icon>
                    <span>${cancelLabel}</span>
                </button>
                <button type="submit" class="btn save">
                    <ui-icon icon="check"></ui-icon>
                    <span>${submitLabel}</span>
                </button>
            </div>
        </div>
    </form>` as HTMLFormElement;

    const fieldsContainer = form.querySelector('.modal-fields') as HTMLElement;
    const actionsContainer = form.querySelector('.modal-actions-left') as HTMLElement;
    const cancelBtn = form.querySelector('.btn.cancel') as HTMLButtonElement;
    const saveBtn = form.querySelector('.btn.save') as HTMLButtonElement;

    cancelBtn.addEventListener('click', () => {
        handleResolve(null);
        close();
    });

    const backdrop = H`<div class="rs-modal-backdrop" on:click=${(ev: MouseEvent) => {
        if (!allowBackdropClose) return;
        if (ev.target === ev.currentTarget) {
            handleResolve(null);
            close();
        }
    }}>${[form]}</div>`;
    document.body.appendChild(backdrop);

    const setBusy = (state: boolean) => {
        busy = state;
        form.toggleAttribute('data-busy', busy);
        saveBtn.disabled = busy;
        cancelBtn.disabled = busy;
    };

    const setValue = (name: string, value: any) => {
        const entry = entries.get(name);
        if (!entry) return;
        const { element, spec } = entry;
        if (element instanceof HTMLSelectElement) {
            const values = Array.isArray(value) ? value.map(String) : value != null ? [String(value)] : [];
            Array.from(element.options).forEach((opt) => {
                opt.selected = values.includes(opt.value);
            });
            return;
        }
        if (element instanceof HTMLTextAreaElement) {
            element.value = Array.isArray(value) ? value.join("\n") : String(value ?? "");
            return;
        }
        if (element.type === "checkbox") {
            element.checked = Boolean(value);
            return;
        }
        if (element.type === "number" || element.type === "range") {
            element.value = value === null || value === undefined || value === "" ? "" : String(value);
            return;
        }
        element.value = value == null ? "" : String(value);
    };

    const getValue = (name: string) => {
        const entry = entries.get(name);
        if (!entry) return undefined;
        return gatherValue(entry);
    };

    const setOptions = (name: string, options: FieldOption[]) => {
        const entry = entries.get(name);
        if (!entry || !(entry.element instanceof HTMLSelectElement)) return;
        entry.element.replaceChildren();
        options?.map(normalizeOption).forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.description) option.setAttribute('data-description', opt.description);
            entry.element.appendChild(option);
        });
    };

    const addField = (spec: FieldSpec, value?: any, host?: HTMLElement) => {
        if (!spec?.name) return null;
        const fieldId = slugId(spec.name);
        let control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        let datalistEl: HTMLDataListElement | null = null;

        if ((spec.options && spec.options.length) || spec.type === "select") {
            const select = H`<select id=${fieldId} name=${spec.name}></select>` as HTMLSelectElement;
            if (spec.multi) {
                select.multiple = true;
            }
            (spec.options || []).map(normalizeOption).forEach((opt) => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.description) {
                    option.setAttribute('data-description', opt.description);
                }
                select.appendChild(option);
            });
            control = select;
        } else if (spec.textarea) {
            control = H`<textarea id=${fieldId} name=${spec.name} placeholder=${spec.placeholder || ""}></textarea>` as HTMLTextAreaElement;
        } else {
            const input = H`<input id=${fieldId} name=${spec.name} type=${spec.type || 'text'} placeholder=${spec.placeholder || ""} />` as HTMLInputElement;
            if (spec.min != null) input.min = String(spec.min);
            if (spec.max != null) input.max = String(spec.max);
            if (spec.step != null) input.step = String(spec.step);
            if (spec.pattern) input.pattern = spec.pattern;
            if (spec.autoComplete) input.setAttribute('autocomplete', spec.autoComplete);
            if (spec.datalist && spec.datalist.length) {
                const listId = `${fieldId}-list`;
                input.setAttribute('list', listId);
                datalistEl = H`<datalist id=${listId}></datalist>` as HTMLDataListElement;
                spec.datalist.map(normalizeOption).forEach((opt) => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    if (opt.label && opt.label !== opt.value) {
                        option.label = opt.label;
                    }
                    datalistEl?.appendChild(option);
                });
            }
            control = input;
        }

        control.required = Boolean(spec.required);
        if (spec.multi && control instanceof HTMLInputElement) {
            control.setAttribute('data-multi', 'true');
        }

        entries.set(spec.name, { element: control, spec });

        const helper = spec.helper ? H`<small class="field-helper">${spec.helper}</small>` : null;

        const field = H`<label class="modal-field" data-field=${spec.name}>
            <span class="label">${spec.label}</span>
            ${control}
            ${helper}
        </label>` as HTMLElement;

        (host ?? fieldsContainer).appendChild(field);
        if (datalistEl) {
            field.appendChild(datalistEl);
        }

        if (value != null) {
            setValue(spec.name, value);
        }

        return field;
    };

    const addFields = (specs: (FieldSpec | null | undefined)[], initial: Record<string, any> = {}, host?: HTMLElement) => {
        specs?.forEach((spec) => {
            if (!spec) return;
            const initialValue = initial?.[spec.name];
            addField(spec, initialValue, host);
        });
    };

    const focusFirst = () => {
        requestAnimationFrame(() => {
            const focusable = form.querySelector<HTMLElement>('input, textarea, select, button:not([disabled])');
            focusable?.focus?.();
        });
    };

    return {
        form,
        close,
        addField,
        addFields,
        focusFirst,
        setBusy,
        setValue,
        getValue,
        setOptions,
        fieldsContainer,
        actionsContainer
    };
};
