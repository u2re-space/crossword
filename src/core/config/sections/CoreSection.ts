import type { SectionConfig } from "@rs-core/config/SettingsTypes";

import { AISection } from "./AISection";
import { MCPSection } from "./MCPSection";
import { TimelineSection } from "./TimelineSection";
import { WebDavSection } from "./WebDavSection";

export const CoreSection: SectionConfig = {
    key: "core",
    title: "Core",
    icon: "gear-six",
    description: "AI, MCP, sync, and timeline configuration.",
    groups: [
        ...AISection.groups,
        ...MCPSection.groups,
        ...WebDavSection.groups,
        ...TimelineSection.groups
    ]
};
