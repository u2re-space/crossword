/**
 * CrossWord Styles Module
 *
 * Centralized style management for the CrossWord application.
 *
 * @module styles
 */

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
