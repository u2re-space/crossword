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

