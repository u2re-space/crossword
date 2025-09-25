import { H } from "fest/lure";

//
export type FieldSpec = { name: string; label: string; type?: string; placeholder?: string };

//
export const ModalForm = (title: string, inputs: Map<string, HTMLInputElement>, resolve: (form: HTMLFormElement | null | Record<string, any>) => void) => {
    const close = () => backdrop?.remove?.();
    const confirm = (ev: SubmitEvent | HTMLFormElement | null) => {
        ev?.preventDefault?.();
        const out: Record<string, any> = {};
        inputs.forEach((input, name) => out[name] = input.value);
        resolve(out);
        close();
    }

    const form = H`<form class="modal-form" on:submit=${confirm}>
        <h3 class="modal-title">${title}</h3>
        <div class="modal-fields">${inputs}</div>
        <div class="modal-actions">
            <button type="button" class="btn cancel" on:click=${() => { resolve(null); close(); }}><ui-icon icon="x"></ui-icon><span>Cancel</span></button>
            <button type="submit" class="btn save"><ui-icon icon="check"></ui-icon><span>Save</span></button>
        </div>
    </form>` as HTMLFormElement;

    //
    const backdrop = H`<div class="rs-modal-backdrop" on:click=${(ev: MouseEvent) => {
        if (!(ev.currentTarget as any)?.matches?.(".rs-modal-backdrop")) { close(); }
    }}>${[form]}</div>`;
    document.body.appendChild(backdrop);

    //
    return form;
}
