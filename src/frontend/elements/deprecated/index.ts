// Enhanced Entity Editors - Unified Export
export { makeEntityEdit, makeEvents, objectExcludeNotExists } from './EntityEdit';
export {
    collectDescriptors,
    buildInitialValues,
    applyDescriptorValues,
    ensureSectionHost,
    cloneEntity,
    fieldDescriptorToSpec,
    type FieldDescriptor
} from './EntityFields';
export { ModalForm, type FieldSpec, type FieldOption, type ModalHandle } from './Modal';
export { createDateTimeEditor, createDateTimeFieldSpec, type DateTimeEditorOptions, type DateTimeEditorHandle } from './DateTimeEditor';
export { createFieldEditor, type FieldEditorHandle, type FieldEditorConfig } from './FieldEditorFactory';

// Re-export types for convenience
export type { TimeType } from '@rs-core/template/EntityInterface';
export type { EntityLike } from '@rs-core/template/EntityId';
