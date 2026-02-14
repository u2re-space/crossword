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

export type CustomInstruction = {
    id: string;
    label: string;
    instruction: string;
    enabled?: boolean;
    order?: number;
};

export type ResponseLanguage = "en" | "ru" | "auto";

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
        /** When true (default), share-target / launch-queue will auto run AI and copy result to clipboard. */
        autoProcessShared?: boolean;
        customInstructions?: CustomInstruction[];
        activeInstructionId?: string;
        // Language and translation settings
        responseLanguage?: ResponseLanguage;
        translateResults?: boolean;
        // Graphics generation settings
        generateSvgGraphics?: boolean;
        // Request timeout settings (in seconds)
        requestTimeout?: {
            low?: number;    // Default: 60
            medium?: number; // Default: 300
            high?: number;   // Default: 900
        };
        maxRetries?: number; // Default: 2
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
        fontSize?: "small" | "medium" | "large";
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
        shareTargetMode: "recognize",
        autoProcessShared: true,
        customInstructions: [],
        activeInstructionId: "",
        responseLanguage: "auto",
        translateResults: false,
        generateSvgGraphics: false,
        requestTimeout: {
            low: 60,      // 1 minute
            medium: 300,  // 5 minutes
            high: 900     // 15 minutes
        },
        maxRetries: 2
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
        fontSize: "medium",
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
