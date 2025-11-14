import type { SectionConfig } from "@rs-core/config/SettingsTypes";

//
export const AISection: SectionConfig = {
    key: "ai",
    title: "AI Integration",
    icon: "cpu",
    description: "Manage credentials for your AI provider and optional bridge services.",
    groups: [
        {
            key: "ai-credentials",
            label: "Credentials",
            fields: [
                { path: "ai.baseUrl", label: "Base URL", type: "text", placeholder: "https://api.openai.com/v1" },
                { path: "ai.apiKey", label: "API key", type: "password", placeholder: "sk-..." },
                {
                    path: "ai.model",
                    label: "Model",
                    type: "select",
                    options: [
                        { value: "gpt-5.1", label: "gpt-5.1" },
                        { value: "custom", label: "Custom..." }
                    ]
                }
            ]
        },
        {
            key: "custom-model",
            label: "Custom model",
            description: "Provide a fully-qualified model identifier.",
            fields: [
                { path: "ai.customModel", label: "Model identifier", type: "text", placeholder: "provider/model" }
            ]
        }
    ]
};
