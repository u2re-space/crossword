import type { SectionConfig } from "../SettingsTypes";

export const AdditionalSection: SectionConfig = {
    key: "additional",
    title: "Additional",
    icon: "dots-three-circle",
    description: "Extra tools and configuration.",
    groups: [
        {
            key: "appearance",
            label: "Appearance",
            description: "Customize the look and feel.",
            fields: [
                {
                    path: "appearance.theme",
                    label: "Theme",
                    type: "select",
                    options: [
                        { value: "auto", label: "System Default" },
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" }
                    ]
                },
                {
                    path: "appearance.color",
                    label: "Accent Color",
                    type: "color-palette",
                    options: [
                        { value: "#469", label: "Default", color: "#469" },
                        { value: "#71717a", label: "Neutral", color: "#71717a" },
                        { value: "#64748b", label: "Slate", color: "#64748b" },
                        { value: "#ef4444", label: "Red", color: "#ef4444" },
                        { value: "#f97316", label: "Orange", color: "#f97316" },
                        { value: "#f59e0b", label: "Amber", color: "#f59e0b" },
                        { value: "#eab308", label: "Yellow", color: "#eab308" },
                        { value: "#84cc16", label: "Lime", color: "#84cc16" },
                        { value: "#22c55e", label: "Green", color: "#22c55e" },
                        { value: "#10b981", label: "Emerald", color: "#10b981" },
                        { value: "#14b8a6", label: "Teal", color: "#14b8a6" },
                        { value: "#06b6d4", label: "Cyan", color: "#06b6d4" },
                        { value: "#3b82f6", label: "Blue", color: "#3b82f6" },
                        { value: "#6366f1", label: "Indigo", color: "#6366f1" },
                        { value: "#8b5cf6", label: "Violet", color: "#8b5cf6" },
                        { value: "#d946ef", label: "Fuchsia", color: "#d946ef" },
                        { value: "#ec4899", label: "Pink", color: "#ec4899" }
                    ]
                }
            ]
        },
        {
            key: "speech",
            label: "Speech Recognition",
            description: "Configure speech recognition settings.",
            fields: [
                {
                    path: "speech.language",
                    label: "Language",
                    type: "select",
                    options: [] // Populated at runtime
                }
            ]
        },
        {
            key: "wallpaper",
            label: "Wallpaper",
            description: "Customize the workspace background.",
            fields: []
        },
        {
            key: "actions",
            label: "Actions",
            description: "Quick actions for the workspace.",
            fields: []
        },
        {
            key: "bluetooth",
            label: "Bluetooth",
            description: "Bluetooth settings.",
            fields: []
        },
        {
            key: "synchronization",
            label: "Synchronization",
            description: "Synchronize the workspace with external services.",
            fields: []
        }
    ]
};
