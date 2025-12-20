/**
 * Toast System - Frontend Integration Layer
 * Re-exports core Toast module with frontend-specific enhancements
 * Maintains backward compatibility with fest/lure-based API
 */

// Re-export everything from core module
export {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearToasts,
    listenForToasts,
    initToastReceiver,
    type ToastKind,
    type ToastOptions,
    type ToastPosition,
    type ToastLayerConfig,
} from "@rs-core/utils/Toast";

// Re-export default with backward-compatible shape
import Toast from "@rs-core/utils/Toast";

export default {
    showToast: Toast.show,
    showSuccess: Toast.success,
    showError: Toast.error,
    showWarning: Toast.warning,
    showInfo: Toast.info,
    clear: Toast.clear,
    listen: Toast.listen,
    init: Toast.init,
};
