export type FieldType = "text" | "password" | "select";

export type FieldOption = {
    value: string;
    label: string;
};

export type FieldConfig = {
    path: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    helper?: string;
    options?: FieldOption[];
};

export type GroupConfig = {
    key?: string;
    label: string;
    description?: string;
    collapsible?: boolean;
    startOpen?: boolean;
    fields: FieldConfig[];
};

export type SectionKey = "ai" | "mcp" | "webdav" | "timeline";

export type SectionConfig = {
    key: SectionKey;
    title: string;
    icon: string;
    description: string;
    groups: GroupConfig[];
};

export type AppSettings = {
    ai: {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
        customModel?: string;
        mcp?: {
            serverLabel?: string;
            origin?: string;
            clientKey?: string;
            secretKey?: string;
        };
    };
    webdav: {
        url?: string;
        username?: string;
        password?: string;
        token?: string;
    };
    timeline: {
        source?: string;
    };
};

export const DEFAULT_SETTINGS: AppSettings = {
    ai: {
        apiKey: "",
        baseUrl: "",
        model: "gpt-5",
        customModel: "",
        mcp: {
            serverLabel: "",
            origin: "",
            clientKey: "",
            secretKey: ""
        }
    },
    webdav: {
        url: "http://localhost:6065",
        username: "",
        password: "",
        token: ""
    },
    timeline: {
        source: ""
    }
};
