export type FieldType = "text" | "password" | "select" | "color-palette" | "shape-palette" | "number-select" | "textarea";

export type FieldOption = {
    value: string;
    label: string;
    color?: string;
    shape?: string;
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

export type SectionKey = "runtime" | "core" | "app" | "ai" | "mcp" | "webdav" | "timeline" | "additional";

export type SectionConfig = {
    key: SectionKey;
    title: string;
    icon: string;
    description: string;
    groups: GroupConfig[];
};

export type CoreMode = "native" | "endpoint";

export type RemoteTarget = {
    id: string;
    label?: string;
    url: string;
    method?: string;
    headers?: Record<string, string>;
    unencrypted?: boolean;
};

export type MCPConfig = {
    id: string;
    serverLabel: string;
    origin: string;
    clientKey: string;
    secretKey: string;
};

export type GridShape =
    | "square" | "squircle" | "circle" | "rounded" | "blob"     // Border-radius based
    | "hexagon" | "diamond" | "star" | "badge" | "heart"        // Clip-path polygonal
    | "clover" | "flower"                                        // Clip-path decorative
    | "egg" | "tear" | "wavy";                                           // Asymmetric / procedural

export type AppSettings = {
    core?: {
        mode?: CoreMode;
        endpointUrl?: string;
        userId?: string;
        userKey?: string;
        encrypt?: boolean;
        preferBackendSync?: boolean;
        ntpEnabled?: boolean;
        ops?: {
            allowUnencrypted?: boolean;
            httpTargets?: RemoteTarget[];
            wsTargets?: RemoteTarget[];
            syncTargets?: RemoteTarget[];
        };
    };
    ai?: {
        apiKey?: string;
        baseUrl?: string;
        model?: string;
        customModel?: string;
        mcp?: MCPConfig[];
        shareTargetMode?: "analyze" | "recognize";
    };
    webdav?: {
        url?: string;
        username?: string;
        password?: string;
        token?: string;
    };
    timeline?: {
        source?: string;
    };
    appearance?: {
        theme?: "light" | "dark" | "auto";
        color?: string;
    };
    speech?: {
        language?: string;
    };
    grid?: {
        columns?: number;
        rows?: number;
        shape?: GridShape;
    };
};

export const DEFAULT_SETTINGS: AppSettings = {
    core: {
        mode: "native",
        endpointUrl: "http://localhost:6065",
        userId: "",
        userKey: "",
        encrypt: false,
        preferBackendSync: true,
        ntpEnabled: false,
        ops: {
            allowUnencrypted: false,
            httpTargets: [],
            wsTargets: [],
            syncTargets: []
        }
    },
    ai: {
        apiKey: "",
        baseUrl: "",
        model: "gpt-5.2",
        customModel: "",
        mcp: [],
        shareTargetMode: "recognize"
    },
    webdav: {
        url: "http://localhost:6065",
        username: "",
        password: "",
        token: ""
    },
    timeline: {
        source: ""
    },
    appearance: {
        theme: "auto",
        color: ""
    },
    speech: {
        language: typeof navigator !== "undefined" ? navigator.language : "en-US"
    },
    grid: {
        columns: 4,
        rows: 8,
        shape: "square"
    }
};
