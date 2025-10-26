import { H } from "fest/lure";
import type { TimeType } from "@rs-core/template/EntityInterface";
import {
    parseDateCorrectly,
    normalizeSchedule,
    formatAsTime,
    formatAsDate,
    getComparableTimeValue,
    isPureHHMM
} from "../utils/TimeUtils";

export type DateTimeEditorOptions = {
    mode?: 'date' | 'time' | 'datetime' | 'timestamp';
    placeholder?: string;
    required?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    onChange?: (value: TimeType | null) => void;
    onValidate?: (isValid: boolean, error?: string) => void;
};

export type DateTimeEditorHandle = {
    element: HTMLElement;
    getValue: () => TimeType | null;
    setValue: (value: TimeType | string | number | null) => void;
    validate: () => boolean;
    focus: () => void;
    destroy: () => void;
};

export const createDateTimeEditor = (
    name: string,
    initialValue: TimeType | string | number | null = null,
    options: DateTimeEditorOptions = {}
): DateTimeEditorHandle => {
    const {
        mode = 'datetime',
        placeholder,
        required = false,
        min,
        max,
        step,
        onChange,
        onValidate
    } = options;

    let currentValue: TimeType | null = normalizeSchedule(initialValue);
    let isValid = true;
    let errorMessage = '';

    // Create the main container
    const container = H`<div class="datetime-editor" data-mode=${mode}></div>` as HTMLElement;

    // Create input elements based on mode
    const createInputs = () => {
        const inputs: HTMLInputElement[] = [];
        const baseAttrs = required ? 'required' : '';

        if (mode === 'date' || mode === 'datetime') {
            const dateInput = H`<input
                type="date"
                class="datetime-date"
                placeholder=${placeholder || 'YYYY-MM-DD'}
                ${baseAttrs}
                ${min ? `min=${min}` : ''}
                ${max ? `max=${max}` : ''}
            />` as HTMLInputElement;
            inputs.push(dateInput);
        }

        if (mode === 'time' || mode === 'datetime') {
            const timeInput = H`<input
                type="time"
                class="datetime-time"
                placeholder=${placeholder || 'HH:MM'}
                ${baseAttrs}
                ${step ? `step=${step}` : ''}
            />` as HTMLInputElement;
            inputs.push(timeInput);
        }

        if (mode === 'timestamp') {
            const timestampInput = H`<input
                type="number"
                class="datetime-timestamp"
                placeholder=${placeholder || 'Unix timestamp (ms)'}
                ${baseAttrs}
                ${min ? `min=${min}` : ''}
                ${max ? `max=${max}` : ''}
            />` as HTMLInputElement;
            inputs.push(timestampInput);
        }

        // Add a text input for manual entry/display
        const textInput = H`<input
            type="text"
            class="datetime-text"
            placeholder=${placeholder || 'Enter date/time manually'}
            ${baseAttrs}
        />` as HTMLInputElement;
        inputs.push(textInput);

        return inputs;
    };

    const inputs = createInputs();
    const [dateInput, timeInput, timestampInput, textInput] = inputs as [HTMLInputElement?, HTMLInputElement?, HTMLInputElement?, HTMLInputElement?];

    // Create error display
    const errorDisplay = H`<div class="datetime-error" style="display: none;"></div>` as HTMLElement;

    // Create format display
    const formatDisplay = H`<div class="datetime-format"></div>` as HTMLElement;

    // Add all elements to container
    container.appendChild(H`<div class="datetime-inputs"></div>` as HTMLElement);
    const inputsContainer = container.querySelector('.datetime-inputs') as HTMLElement;
    inputs.forEach(input => inputsContainer.appendChild(input));
    container.appendChild(errorDisplay);
    container.appendChild(formatDisplay);

    // Validation function
    const validate = (): boolean => {
        let valid = true;
        let error = '';

        if (required && !currentValue) {
            valid = false;
            error = 'This field is required';
        } else if (currentValue) {
            const parsed = parseDateCorrectly(currentValue);
            if (!parsed || Number.isNaN(parsed.getTime())) {
                valid = false;
                error = 'Invalid date/time format';
            } else {
                // Check min/max constraints
                const timeValue = getComparableTimeValue(currentValue);
                if (min && timeValue < getComparableTimeValue(min)) {
                    valid = false;
                    error = `Date must be after ${formatAsDate(min)}`;
                }
                if (max && timeValue > getComparableTimeValue(max)) {
                    valid = false;
                    error = `Date must be before ${formatAsDate(max)}`;
                }
            }
        }

        isValid = valid;
        errorMessage = error;

        // Update UI
        container.classList.toggle('invalid', !valid);
        errorDisplay.style.display = valid ? 'none' : 'block';
        errorDisplay.textContent = error;

        onValidate?.(valid, error);
        return valid;
    };

    // Update format display
    const updateFormatDisplay = () => {
        if (currentValue) {
            const parsed = parseDateCorrectly(currentValue);
            if (parsed && !Number.isNaN(parsed.getTime())) {
                let format = '';
                if (mode === 'date' || mode === 'datetime') {
                    format += formatAsDate(currentValue);
                }
                if (mode === 'time' || mode === 'datetime') {
                    if (format) format += ' at ';
                    format += formatAsTime(currentValue);
                }
                if (mode === 'timestamp' && currentValue.timestamp) {
                    format = `Timestamp: ${currentValue.timestamp}`;
                }
                formatDisplay.textContent = format;
            } else {
                formatDisplay.textContent = '';
            }
        } else {
            formatDisplay.textContent = '';
        }
    };

    // Sync inputs with current value
    const syncInputs = () => {
        if (!currentValue) {
            dateInput && (dateInput.value = '');
            timeInput && (timeInput.value = '');
            timestampInput && (timestampInput.value = '');
            textInput && (textInput.value = '');
            return;
        }

        const parsed = parseDateCorrectly(currentValue);
        if (!parsed || Number.isNaN(parsed.getTime())) {
            textInput && (textInput.value = JSON.stringify(currentValue));
            return;
        }

        // Update date input
        if (dateInput) {
            const dateStr = parsed.toISOString().split('T')[0];
            dateInput.value = dateStr;
        }

        // Update time input
        if (timeInput) {
            const timeStr = parsed.toTimeString().split(' ')[0].substring(0, 5);
            timeInput.value = timeStr;
        }

        // Update timestamp input
        if (timestampInput) {
            timestampInput.value = parsed.getTime().toString();
        }

        // Update text input
        if (textInput) {
            if (currentValue.iso_date) {
                textInput.value = currentValue.iso_date;
            } else if (currentValue.date) {
                textInput.value = currentValue.date;
            } else if (currentValue.timestamp) {
                textInput.value = currentValue.timestamp.toString();
            } else {
                textInput.value = JSON.stringify(currentValue);
            }
        }
    };

    // Parse input values and update current value
    const updateFromInputs = () => {
        let newValue: TimeType | null = null;

        if (mode === 'date' && dateInput?.value) {
            newValue = { date: dateInput.value };
        } else if (mode === 'time' && timeInput?.value) {
            newValue = { iso_date: `1970-01-01T${timeInput.value}:00` };
        } else if (mode === 'datetime') {
            const date = dateInput?.value;
            const time = timeInput?.value;
            if (date && time) {
                newValue = { iso_date: `${date}T${time}:00` };
            } else if (date) {
                newValue = { date };
            } else if (time) {
                newValue = { iso_date: `1970-01-01T${time}:00` };
            }
        } else if (mode === 'timestamp' && timestampInput?.value) {
            const timestamp = Number(timestampInput.value);
            if (!Number.isNaN(timestamp)) {
                newValue = { timestamp };
            }
        }

        // Fallback to text input
        if (!newValue && textInput?.value.trim()) {
            const text = textInput.value.trim();
            if (isPureHHMM(text)) {
                newValue = { iso_date: `1970-01-01T${text}:00` };
            } else {
                newValue = normalizeSchedule(text);
            }
        }

        currentValue = newValue;
        validate();
        updateFormatDisplay();
        onChange?.(currentValue);
    };

    // Add event listeners
    const addEventListeners = () => {
        inputs.forEach(input => {
            input.addEventListener('input', updateFromInputs);
            input.addEventListener('change', updateFromInputs);
            input.addEventListener('blur', updateFromInputs);
        });
    };

    // Initialize
    const initialize = () => {
        syncInputs();
        addEventListeners();
        validate();
        updateFormatDisplay();
    };

    // Public API
    const handle: DateTimeEditorHandle = {
        element: container,
        getValue: () => currentValue,
        setValue: (value) => {
            currentValue = normalizeSchedule(value);
            syncInputs();
            validate();
            updateFormatDisplay();
        },
        validate,
        focus: () => {
            const firstInput = inputs.find(input => input instanceof HTMLInputElement) as HTMLInputElement;
            firstInput?.focus();
        },
        destroy: () => {
            inputs.forEach(input => {
                input.removeEventListener('input', updateFromInputs);
                input.removeEventListener('change', updateFromInputs);
                input.removeEventListener('blur', updateFromInputs);
            });
            container.remove();
        }
    };

    initialize();
    return handle;
};

// Helper function to create a date/time field spec
export const createDateTimeFieldSpec = (
    name: string,
    label: string,
    options: DateTimeEditorOptions = {}
) => {
    return {
        name,
        label,
        type: 'datetime' as const,
        placeholder: options.placeholder,
        required: options.required,
        min: options.min,
        max: options.max,
        step: options.step,
        customEditor: 'datetime' as const,
        editorOptions: options
    };
};
