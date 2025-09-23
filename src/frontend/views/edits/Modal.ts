import { H } from "fest/lure";

export type FieldSpec = { name: string; label: string; type?: string; placeholder?: string };

export const openFormModal = async (title: string, fields: (FieldSpec | null)[], initial: Record<string, any> = {}): Promise<Record<string, any> | null> => {
    return new Promise((resolve) => {
        const close = () => backdrop?.remove?.();

        const inputs = new Map<string, HTMLInputElement>();

        const form = H`<form class="modal-form" on:submit=${(ev: SubmitEvent) => {
            ev.preventDefault();
            const out: Record<string, any> = {};
            inputs.forEach((input, name) => out[name] = input.value);
            resolve(out);
            close();
        }}>
            <h3 class="modal-title">${title}</h3>
            <div class="modal-fields"></div>
            <div class="modal-actions">
                <button type="button" class="btn cancel" on:click=${() => { resolve(null); close(); }}><ui-icon icon="x"></ui-icon><span>Cancel</span></button>
                <button type="submit" class="btn save"><ui-icon icon="check"></ui-icon><span>Save</span></button>
            </div>
        </form>` as HTMLFormElement;

        const fieldsHolder = form.querySelector('.modal-fields') as HTMLElement;
        for (const f of fields) {
            if (!f) continue;
            const value = initial?.[f.name] ?? '';
            const input = H`<input name=${f.name} type=${f.type || 'text'} placeholder=${f.placeholder || ''} value=${String(value)} />` as HTMLInputElement;
            inputs.set(f.name, input);
            const row = H`<label class="modal-field">
                <span class="label">${f.label}</span>
                ${input}
            </label>`;
            fieldsHolder.appendChild(row);
        }

        const backdrop = H`<div class="rs-modal-backdrop" on:click=${(ev: MouseEvent) => { if (ev.target === ev.currentTarget) { resolve(null); close(); } }}>${[form]}</div>`;
        document.body.appendChild(backdrop);

        // autofocus first input
        const first = form.querySelector('input') as HTMLInputElement | null;
        first?.focus?.();
    });
}
