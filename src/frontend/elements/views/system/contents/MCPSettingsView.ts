import type { SectionConfig } from "../../types/SettingsTypes";

export const MCPSettingsView: SectionConfig = {
    key: "mcp",
    title: "Model Context Protocol",
    icon: "plugs",
    description: "Bridge the assistant with local or remote MCP servers for tool access.",
    groups: [
        {
            key: "mcp-core",
            label: "Bridge configuration",
            description: "Optional integration—leave blank if unused.",
            collapsible: true,
            startOpen: false,
            fields: [
                { path: "ai.mcp.serverLabel", label: "Server label", type: "text", placeholder: "my-bridge" },
                { path: "ai.mcp.origin", label: "Origin", type: "text", placeholder: "https://server.example" },
                { path: "ai.mcp.clientKey", label: "Client key", type: "text" },
                { path: "ai.mcp.secretKey", label: "Secret key", type: "password" }
            ]
        }
    ]
};
