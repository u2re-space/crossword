/**
 * CrossWord Shared Frontend Module
 *
 * Shared registries, channel helpers, and layer/style utilities.
 *
 * @module frontend/shared
 */

// Registries and channel helpers
export * from "./registry";
export * from "./channel-mixin";
export * from "./view-message-routing";

// Layer management
export {
    initializeLayers,
    resetLayers,
    getShellLayer,
    getViewLayer,
    getLayerOrder,
    getLayersByCategory,
    areLayersInitialized,
    getLayerElement,
    LAYERS,
    LAYER_HIERARCHY,
    type LayerCategory,
    type LayerDefinition,
    type LayerName,
    type ShellId,
    type ViewId,
} from './layer-manager';

// Re-export default for convenient import
export { default as LayerManager } from './layer-manager';
