import type { SectionConfig } from "@rs-core/config/SettingsTypes";

import { AISection } from "./AISection.ts";
import { MCPSection } from "./MCPSection.ts";
import { TimelineSection } from "./TimelineSection.ts";
import { WebDavSection } from "./WebDavSection.ts";

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
