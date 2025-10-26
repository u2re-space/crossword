import { H } from "fest/lure";
import type { FieldDescriptor } from "./EntityFields";
import type { DateTimeEditorOptions } from "./DateTimeEditor";

export type FieldEditorType = 'text' | 'textarea' | 'select' | 'number' | 'datetime' | 'json' | 'multiline';

export type FieldEditorConfig = {
    type: FieldEditorType;
    options?: Record<string, any>;
    validation?: (value: any) => boolean | string;
    transform?: (value: any) => any;
};

export type FieldEditorHandle = {
    element: HTMLElement;
    getValue: () => any;
    setValue: (value: any) => void;
    validate: () => boolean;
    focus: () => void;
    destroy: () => void;
};

export const createFieldEditor = (
    descriptor: FieldDescriptor,
    initialValue: any = null
): FieldEditorHandle => {
    const { customEditor, editorOptions, validator } = descriptor;

    // Handle custom editors
    if (customEditor === 'datetime') {
        return createDateTimeEditor(descriptor, initialValue);
    }

    if (customEditor === 'json') {
        return createJsonEditor(descriptor, initialValue);
    }

    if (customEditor === 'multiline') {
        return createMultilineEditor(descriptor, initialValue);
    }

    // Default to standard input
    return createStandardEditor(descriptor, initialValue);
};

const createDateTimeEditor = (descriptor: FieldDescriptor, initialValue: any): FieldEditorHandle => {
    // Dynamic import for datetime editor
    let editor: any = null;
    let isLoaded = false;

    const container = H`<div class="datetime-editor-placeholder">
        Loading datetime editor...
    </div>` as HTMLElement;

    const loadEditor = async () => {
        if (isLoaded) return;
        try {
            const { createDateTimeEditor } = await import('./DateTimeEditor');
            const options: DateTimeEditorOptions = {
                mode: descriptor.path.includes('begin_time') || descriptor.path.includes('end_time') ? 'datetime' :
                    descriptor.path.includes('timestamp') ? 'timestamp' : 'date',
                required: descriptor.required,
                placeholder: descriptor.placeholder,
                ...descriptor.editorOptions
            };
            editor = createDateTimeEditor(descriptor.name, initialValue, options);
            container.replaceWith(editor.element);
            isLoaded = true;
        } catch (error) {
            console.warn('Failed to load datetime editor, falling back to text input:', error);
            const fallback = createStandardEditor(descriptor, initialValue);
            container.replaceWith(fallback.element);
            editor = fallback;
            isLoaded = true;
        }
    };

    // Load editor asynchronously
    loadEditor();

    return {
        element: container,
        getValue: () => editor?.getValue?.() ?? initialValue,
        setValue: (value) => editor?.setValue?.(value),
        validate: () => editor?.validate?.() ?? true,
        focus: () => editor?.focus?.(),
        destroy: () => editor?.destroy?.()
    };
};

const createJsonEditor = (descriptor: FieldDescriptor, initialValue: any): FieldEditorHandle => {
    const textarea = H`<textarea
        name=${descriptor.name}
        placeholder=${descriptor.placeholder || 'Enter JSON data'}
        ${descriptor.required ? 'required' : ''}
        data-json="true"
        data-multiline="true"
    >${typeof initialValue === 'string' ? initialValue : JSON.stringify(initialValue, null, 2)}</textarea>` as HTMLTextAreaElement;

    const container = H`<div class="json-editor"></div>` as HTMLElement;
    container.appendChild(textarea);

    return {
        element: container,
        getValue: () => {
            try {
                return JSON.parse(textarea.value);
            } catch {
                return textarea.value;
            }
        },
        setValue: (value) => {
            textarea.value = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        },
        validate: () => {
            if (descriptor.required && !textarea.value.trim()) return false;
            try {
                JSON.parse(textarea.value);
                return true;
            } catch {
                return false;
            }
        },
        focus: () => textarea.focus(),
        destroy: () => container.remove()
    };
};

const createMultilineEditor = (descriptor: FieldDescriptor, initialValue: any): FieldEditorHandle => {
    const textarea = H`<textarea
        name=${descriptor.name}
        placeholder=${descriptor.placeholder || 'Enter text'}
        ${descriptor.required ? 'required' : ''}
        data-multiline="true"
    >${Array.isArray(initialValue) ? initialValue.join('\n') : initialValue || ''}</textarea>` as HTMLTextAreaElement;

    const container = H`<div class="multiline-editor"></div>` as HTMLElement;
    container.appendChild(textarea);

    return {
        element: container,
        getValue: () => {
            const value = textarea.value;
            return value.includes('\n') ? value.split('\n').filter(Boolean) : value;
        },
        setValue: (value) => {
            textarea.value = Array.isArray(value) ? value.join('\n') : value || '';
        },
        validate: () => {
            if (descriptor.required && !textarea.value.trim()) return false;
            return true;
        },
        focus: () => textarea.focus(),
        destroy: () => container.remove()
    };
};

const createStandardEditor = (descriptor: FieldDescriptor, initialValue: any): FieldEditorHandle => {
    let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    if (descriptor.options && descriptor.options.length > 0) {
        const select = H`<select name=${descriptor.name} ${descriptor.required ? 'required' : ''}></select>` as HTMLSelectElement;

        if (descriptor.multi) {
            select.multiple = true;
        }

        descriptor.options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = typeof option === 'string' ? option : option.value;
            optionEl.textContent = typeof option === 'string' ? option : option.label;
            select.appendChild(optionEl);
        });

        input = select;
    } else if (descriptor.textarea) {
        input = H`<textarea
            name=${descriptor.name}
            placeholder=${descriptor.placeholder || ''}
            ${descriptor.required ? 'required' : ''}
        >${initialValue || ''}</textarea>` as HTMLTextAreaElement;
    } else {
        input = H`<input
            type=${descriptor.type || 'text'}
            name=${descriptor.name}
            placeholder=${descriptor.placeholder || ''}
            ${descriptor.required ? 'required' : ''}
            value=${initialValue || ''}
        />` as HTMLInputElement;
    }

    const container = H`<div class="standard-editor"></div>` as HTMLElement;
    container.appendChild(input);

    return {
        element: container,
        getValue: () => {
            if (input instanceof HTMLSelectElement && input.multiple) {
                return Array.from(input.selectedOptions).map(opt => opt.value);
            }
            return input.value;
        },
        setValue: (value) => {
            if (input instanceof HTMLSelectElement && input.multiple) {
                const values = Array.isArray(value) ? value : [value];
                Array.from(input.options).forEach(opt => {
                    opt.selected = values.includes(opt.value);
                });
            } else {
                input.value = value || '';
            }
        },
        validate: () => {
            if (descriptor.required && !input.value.trim()) return false;
            if (descriptor.validator) {
                const result = descriptor.validator(input.value);
                return result === true;
            }
            return true;
        },
        focus: () => input.focus(),
        destroy: () => container.remove()
    };
};
