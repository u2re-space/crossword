import type { SectionConfig } from "@rs-core/config/SettingsTypes";

import { AdditionalSection } from "./AdditionalSection.ts";

export const AppSection: SectionConfig = {
    key: "app",
    title: "App",
    icon: "paint-roller",
    description: "Appearance, grid layout, UI/UX, inputs, and quick actions.",
    groups: [...AdditionalSection.groups]
};
