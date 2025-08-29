export const NAME_SCHEME = { type: "string", minLength: 1 };
export const DESCRIPTION_SCHEME = { type: "string" };
export const ICON_SCHEME = { type: "string" };
export const TAGS_SCHEME = { type: "array", items: { type: "string" } };
export const IMAGE_SCHEME = { type: "array", items: { type: "string", format: "uri" } };
export const WHERE_IS_SCHEME = { type: "array", items: { type: "string" } };
export const SERVICES_SCHEME = { type: "array", items: { type: "string" } };
export const MEMBERS_SCHEME = { type: "array", items: { type: "string" } };
export const TASKS_SCHEME = { type: "array", items: { type: "string" } };
export const ACTIONS_SCHEME = { type: "array", items: { type: "string" } };
export const DIFFICULTY_SCHEME = { type: "number", minimum: 0 };
export const DURATION_SCHEME = { type: "number", minimum: 0 };
export const LEVEL_SCHEME = { type: "number", minimum: 0, maximum: 100 };
export const USAGE_SCHEME = { type: "string" };
export const PERSON_SCHEME = { type: "array", items: { type: "string" } };
export const BONUSES_SCHEME = { type: "array", items: { type: "string" } };
export const FEEDBACKS_SCHEME = { type: "array", items: { type: "string" } };

export const COORDINATES_SCHEME = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    properties: {
        latitude: { type: "number", minimum: -90, maximum: 90 },
        longitude: { type: "number", minimum: -180, maximum: 180 }
    },
    required: ["latitude", "longitude"]
};

export const CONTACT_SCHEME = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    properties: {
        name: { type: "string" },
        phone: { type: "array", items: { type: "string" } },
        email: { type: "array", items: { type: "string", format: "email" } }
    },
    required: ["name"]
};

export const TIMESTAMP_SCHEME = {
    anyOf: [
        { type: "number" },
        { type: "string", format: "date-time" }
    ]
};

export const AVAILABILITY_SCHEME = {
    enum: ["public", "everyone", "members", "private", "other"]
};

export const AVAILABILITY_TIME_SCHEME = {
    type: "array",
    items: { type: "string", format: "time" }
};

export const AVAILABILITY_DAYS_SCHEME = {
    type: "array",
    items: { type: "string" }
};

export const PERMISSIONS_SCHEME = {
    enum: ["public", "everyone", "members", "private", "other"]
};

export const SHARED_DEFS = {
    Coordinates: COORDINATES_SCHEME,
    Contact: CONTACT_SCHEME,
    Tags: TAGS_SCHEME,
    Images: IMAGE_SCHEME,
    Id: { type: "string" },
    IdArray: { type: "array", items: { type: "string" } },
    LocationRef: {
        anyOf: [
            { $ref: "#/$defs/Coordinates" },
            { $ref: "#/$defs/Id" }
        ]
    },
    Timestamp: TIMESTAMP_SCHEME
};

export const JSON_SCHEMES = {
    location: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            coordinates: { $ref: "#/$defs/Coordinates" },
            street: { type: "string" },
            house: { type: "string" },
            flat: { type: "string" },
            floor: { type: "number" },
            room: { type: "number" },
            square: { type: "number" },
            price: { type: "number" },
            members: { $ref: "#/$defs/IdArray" },
            services: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },
            rewards: BONUSES_SCHEME
        },
        required: ["name"]
    },
    skill: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        kind: { enum: ["skill", "knowledge", "ability", "trait", "experience", "other"] },
        profession_related: { $ref: "#/$defs/IdArray" }, // professions related to this skill
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            tags: { $ref: "#/$defs/Tags" },
            level: LEVEL_SCHEME,
            tasks: { $ref: "#/$defs/IdArray" },
            actions: ACTIONS_SCHEME,
            bonuses: BONUSES_SCHEME,
            results: { type: "array", items: { type: "string" } }
        },
        required: ["name"]
    },
    vendor: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            coordinates: { $ref: "#/$defs/Coordinates" },
            members: { $ref: "#/$defs/IdArray" },
            services: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["name"]
    },
    market: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        kind: { enum: ["online", "market", "shop", "mall", "cafe", "bar", "restaurant", "hotel", "other"] },
        purpose: { enum: ["entertainment", "food", "services", "medical", "electronics", "furniture", "specialized", "professional", "other"] },
        permissions: PERMISSIONS_SCHEME,
        availability: AVAILABILITY_SCHEME,
        availabilityTime: AVAILABILITY_TIME_SCHEME,
        availabilityDays: AVAILABILITY_DAYS_SCHEME,
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            location: { $ref: "#/$defs/LocationRef" },
            members: { $ref: "#/$defs/IdArray" },
            services: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["name"]
    },
    placement: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            kind: { enum: ["place", "location", "shop", "restaurant", "cafe", "bar", "hotel", "other"] },
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            coordinates: { $ref: "#/$defs/LocationRef" },
            members: { $ref: "#/$defs/IdArray" },
            services: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["name"]
    },
    service: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            whereIs: WHERE_IS_SCHEME,
            location: { $ref: "#/$defs/LocationRef" },
            persons: PERSON_SCHEME,
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },
            actions: ACTIONS_SCHEME,
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            feedbacks: FEEDBACKS_SCHEME,
            price: { type: "number" },
            quantity: { type: "number" }
        },
        required: ["name"]
    },
    person: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            home: { $ref: "#/$defs/LocationRef" },
            jobs: { type: "array", items: { $ref: "#/$defs/LocationRef" } },
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },
            services: { $ref: "#/$defs/IdArray" },
            tasks: { $ref: "#/$defs/IdArray" },
            actions: ACTIONS_SCHEME,
            feedbacks: FEEDBACKS_SCHEME
        },
        required: ["name"]
    },
    vehicle: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            whereIs: WHERE_IS_SCHEME,
            location: { $ref: "#/$defs/LocationRef" },
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            feedbacks: FEEDBACKS_SCHEME,
            price: { type: "number" },
            quantity: { type: "number" }
        },
        required: ["name"]
    },
    time: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },
            location: { $ref: "#/$defs/LocationRef" },
            begin_time: { $ref: "#/$defs/Timestamp" },
            end_time: { $ref: "#/$defs/Timestamp" },
            actions: ACTIONS_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["name", "begin_time"]
    },
    event: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            location: { $ref: "#/$defs/LocationRef" },
            begin_time: { $ref: "#/$defs/Timestamp" },
            end_time: { $ref: "#/$defs/Timestamp" },
            tags: { $ref: "#/$defs/Tags" },
            members: { $ref: "#/$defs/IdArray" },
            tasks: { $ref: "#/$defs/IdArray" },
            actions: ACTIONS_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["name", "begin_time"]
    },
    task: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            location: { $ref: "#/$defs/LocationRef" },
            tags: { $ref: "#/$defs/Tags" },
            members: { $ref: "#/$defs/IdArray" },
            actions: ACTIONS_SCHEME,
            bonuses: BONUSES_SCHEME
        },
        required: ["name"]
    },
    item: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            kind: { enum: ["book", "electronics", "furniture", "medicine", "tools", "software", "consumables", "other"] },
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            whereIs: WHERE_IS_SCHEME,
            location: { $ref: "#/$defs/LocationRef" },
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },
            actions: ACTIONS_SCHEME,
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            feedbacks: FEEDBACKS_SCHEME,
            price: { type: "number" },
            quantity: { type: "number" }
        },
        required: ["name"]
    },
    action: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            kind: { enum: ["thinking", "imagination", "remembering", "speaking", "learning", "listening", "reading", "writing", "moving", "traveling", "speech", "physically", "crafting", "following", "other"] },
            image: { $ref: "#/$defs/Images" },
            whereIs: WHERE_IS_SCHEME,
            location: { $ref: "#/$defs/LocationRef" },
            difficulty: DIFFICULTY_SCHEME,
            duration: DURATION_SCHEME,
            tasks: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["name"]
    },
    entertainment: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            kind: { enum: ["entertainment", "sport", "education", "cinema", "museum", "hobby", "drawing", "reading", "shopping", "other"] },
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            whereIs: WHERE_IS_SCHEME,
            location: { $ref: "#/$defs/LocationRef" },
            persons: PERSON_SCHEME,
            contacts: { $ref: "#/$defs/Contact" },
            begin_time: { $ref: "#/$defs/Timestamp" },
            end_time: { $ref: "#/$defs/Timestamp" },
            tasks: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },
            actions: ACTIONS_SCHEME,
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            feedbacks: FEEDBACKS_SCHEME
        },
        required: ["name"]
    },
    bonus: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            kind: { enum: [
                "cash-back", "promo-code", "loyalty-card", "gift-card", "discount",
                "bonus-card", "bonus-points", "bonus-points-card", "earn-points", "earn-points-card"
            ] },

            //
            availability: AVAILABILITY_SCHEME,
            availabilityTime: AVAILABILITY_TIME_SCHEME,
            availabilityDays: AVAILABILITY_DAYS_SCHEME,

            //
            requirements: { $ref: "#/$defs/IdArray" },

            // additional properties
            payload: { type: "object" },

            // items, services, entertainment, vehicles, actions, memberships, events
            usableFor: { $ref: "#/$defs/IdArray" },

            // locations, markets, places
            usableIn: { $ref: "#/$defs/IdArray" },
            location: { $ref: "#/$defs/LocationRef" },
            market: { $ref: "#/$defs/Id" },

            // where is can be found
            whereIs: WHERE_IS_SCHEME,

            //
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },

            //
            persons: PERSON_SCHEME,
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },

            //
            actions: ACTIONS_SCHEME,
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["kind"]
    }
};

export const AI_OUTPUT_SCHEMA = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    oneOf: [
        JSON_SCHEMES.location,
        JSON_SCHEMES.vendor,
        JSON_SCHEMES.market,
        JSON_SCHEMES.placement,
        JSON_SCHEMES.service,
        JSON_SCHEMES.person,
        JSON_SCHEMES.vehicle,
        JSON_SCHEMES.time,
        JSON_SCHEMES.event,
        JSON_SCHEMES.task,
        JSON_SCHEMES.item,
        JSON_SCHEMES.action,
        JSON_SCHEMES.entertainment,
        JSON_SCHEMES.bonus
    ]
};
