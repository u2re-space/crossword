import { loadSettings, DEFAULT_SETTINGS } from './Settings.js';
import './index.js';

"use strict";
let provider = loadSettings;
const setRuntimeSettingsProvider = (next) => {
  provider = next;
};
const getRuntimeSettings = async () => {
  try {
    const value = await provider();
    return value || DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export { getRuntimeSettings, setRuntimeSettingsProvider };
//# sourceMappingURL=RuntimeSettings.js.map
