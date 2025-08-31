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

//
export const JSON_SCHEMES = {
    task: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            icon: ICON_SCHEME,
            description: DESCRIPTION_SCHEME,
            status: { enum: ["under_consideration", "pending", "in_progress", "completed", "failed", "delayed", "canceled", "other"] },

            //
            image: { $ref: "#/$defs/Images" },
            tags: { $ref: "#/$defs/Tags" },

            //
            begin_time: { $ref: "#/$defs/Timestamp" },
            end_time: { $ref: "#/$defs/Timestamp" },

            //
            location: { $ref: "#/$defs/LocationRef" },
            contacts: { $ref: "#/$defs/Contact" },
            members: { $ref: "#/$defs/IdArray" },
            events: { $ref: "#/$defs/IdArray" },

            //
            rewards: BONUSES_SCHEME,
            bonuses: BONUSES_SCHEME,
            actions: ACTIONS_SCHEME,
            costs: BONUSES_SCHEME
        },
        required: ["name", "status", "location"]
    },

    //
    factor: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            icon: ICON_SCHEME,
            tags: { $ref: "#/$defs/Tags" },
            kind: { enum: ["weather", "health", "family", "relationships", "job", "traffic", "business", "economy", "politics", "other"] },
            affect: { enum: ["positive", "negative", "neutral"] },
            actions: { $ref: "#/$defs/IdArray" },
            image: { $ref: "#/$defs/Images" },
            description: DESCRIPTION_SCHEME,
        },
        required: ["name", "kind", "affect"]
    },

    //
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

    //
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

    //
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
            feedbacks: FEEDBACKS_SCHEME,
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["name"]
    },

    //
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

            //
            location: { $ref: "#/$defs/LocationRef" },

            //
            members: { $ref: "#/$defs/IdArray" },
            services: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },

            //
            feedbacks: FEEDBACKS_SCHEME,
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            costs: BONUSES_SCHEME
        },
        required: ["name"]
    },

    //
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

            //
            coordinates: { $ref: "#/$defs/LocationRef" },
            members: { $ref: "#/$defs/IdArray" },
            services: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },

            //
            feedbacks: FEEDBACKS_SCHEME,
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            costs: BONUSES_SCHEME
        },
        required: ["name"]
    },

    //
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

            //
            whereIs: WHERE_IS_SCHEME,

            //
            location: { $ref: "#/$defs/LocationRef" },

            //
            persons: PERSON_SCHEME,
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },
            tasks: { $ref: "#/$defs/IdArray" },
            actions: ACTIONS_SCHEME,

            //
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            costs: BONUSES_SCHEME,
            feedbacks: FEEDBACKS_SCHEME,

            //
            price: { type: "number" },
            quantity: { type: "number" }
        },
        required: ["name"]
    },

    //
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
            tags: { $ref: "#/$defs/Tags" },
            tasks: { $ref: "#/$defs/IdArray" },

            //
            contacts: { $ref: "#/$defs/Contact" },
            services: { $ref: "#/$defs/IdArray" },

            //
            actions: ACTIONS_SCHEME,
            feedbacks: FEEDBACKS_SCHEME
        },
        required: ["name"]
    },

    // it's your car, transport, bike, or rented transport, or ride on bus, train, etc.
    vehicle: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            icon: ICON_SCHEME,
            description: DESCRIPTION_SCHEME,
            image: { $ref: "#/$defs/Images" },

            //
            role: { enum: ["driver", "passenger", "other"] },
            rights: { enum: ["own", "rented", "borrowed", "service", "free", "other"] },
            destination: { $ref: "#/$defs/LocationRef" },
            route: { $ref: "#/$defs/IdArray" }, // routes to destination, in future it may be separate entity, but now it's just array of locations

            // for bus, train, etc.
            timeLimit: { $ref: "#/$defs/Timestamp" },

            //
            location: { $ref: "#/$defs/LocationRef" },
            services: { $ref: "#/$defs/IdArray" },
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },

            //
            members: { $ref: "#/$defs/IdArray" },

            //
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            feedbacks: FEEDBACKS_SCHEME,

            //
            price: { type: "number" },
            quantity: { type: "number" }
        },
        required: ["name"]
    },

    //
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

            //
            tags: { $ref: "#/$defs/Tags" },

            //
            location: { $ref: "#/$defs/LocationRef" },

            //
            tasks: { $ref: "#/$defs/IdArray" },

            //
            begin_time: { $ref: "#/$defs/Timestamp" },
            end_time: { $ref: "#/$defs/Timestamp" },

            //
            members: { $ref: "#/$defs/IdArray" },

            //
            actions: ACTIONS_SCHEME,

            //
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            costs: BONUSES_SCHEME
        },
        required: ["name", "begin_time"]
    },

    //
    item: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            kind: { enum: ["currency", "book", "electronics", "furniture", "medicine", "tools", "software", "consumables", "other"] },
            icon: ICON_SCHEME,
            description: DESCRIPTION_SCHEME,

            //
            image: { $ref: "#/$defs/Images" },

            //
            markets: { $ref: "#/$defs/IdArray" },

            //
            location: { $ref: "#/$defs/LocationRef" },
            contacts: { $ref: "#/$defs/Contact" },
            tags: { $ref: "#/$defs/Tags" },

            //
            suitableFor: ACTIONS_SCHEME,
            feedbacks: FEEDBACKS_SCHEME,

            //
            price: { type: "number" }, // if currency, used for exchange (RUB/EUR/USD)
            quantity: { type: "number" } // if currency, how many money you has, negative value is used for debt
        },
        required: ["name"]
    },

    //
    action: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            tags: { $ref: "#/$defs/Tags" },
            kind: { enum: ["thinking", "imagination", "remembering", "speaking", "learning", "listening", "reading", "writing", "moving", "traveling", "speech", "physically", "crafting", "following", "other"] },
            image: { $ref: "#/$defs/Images" },

            //
            difficulty: DIFFICULTY_SCHEME,
            duration: DURATION_SCHEME,

            // <isn't very good suitable for actions, preferred for tasks>
            location: { $ref: "#/$defs/LocationRef" },

            // for what tasks doing this action
            tasks: { $ref: "#/$defs/IdArray" },

            // what used items, skills, services, etc. so needs to mention entity type
            // arrays of pairs of entity type and entity id, e.g. [{ type: "item", id: "book" }, { type: "skill", id: "coding" }]
            whatUsed: { $ref: "#/$defs/IdArray" },

            //
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            costs: BONUSES_SCHEME
        },
        required: ["name"]
    },

    //
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

            //
            actions: ACTIONS_SCHEME,
            persons: PERSON_SCHEME,

            //
            contacts: { $ref: "#/$defs/Contact" },

            //
            location: { $ref: "#/$defs/LocationRef" },
            begin_time: { $ref: "#/$defs/Timestamp" },
            end_time: { $ref: "#/$defs/Timestamp" },

            //
            tasks: { $ref: "#/$defs/IdArray" },
            tags: { $ref: "#/$defs/Tags" },

            //
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME,
            feedbacks: FEEDBACKS_SCHEME
        },
        required: ["name"]
    },

    //
    bonus: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            icon: ICON_SCHEME,
            tags: { $ref: "#/$defs/Tags" },
            kind: { enum: [
                "cash-back", "promo-code", "loyalty-card", "gift-card", "discount",
                "bonus-card", "bonus-points", "bonus-points-card", "earn-points", "earn-points-card"
            ] },
            description: DESCRIPTION_SCHEME,
            image: { $ref: "#/$defs/Images" },

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

            //
            persons: PERSON_SCHEME,
            contacts: { $ref: "#/$defs/Contact" },

            //
            actions: ACTIONS_SCHEME,
            bonuses: BONUSES_SCHEME,
            rewards: BONUSES_SCHEME
        },
        required: ["kind"]
    },

    //
    lottery: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            name: NAME_SCHEME,
            description: DESCRIPTION_SCHEME,
            requirements: { $ref: "#/$defs/IdArray" },
            icon: ICON_SCHEME,
            chance: { type: "number", minimum: 0, maximum: 100 },
            image: { $ref: "#/$defs/Images" },
            location: { $ref: "#/$defs/LocationRef" },
            tags: { $ref: "#/$defs/Tags" },
            usageLimit: { type: "number" },
            timeLimit: { $ref: "#/$defs/Timestamp" },
            rewards: BONUSES_SCHEME,
            bonuses: BONUSES_SCHEME,
            costs: BONUSES_SCHEME
        },
        required: ["name", "chance", "rewards", "requirements"]
    },

    // also, may means debt, receipt, etc.
    fine: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            // what needs to give in case of fine (time is may be arrest or sentence, or job), but not for reward
            type: { enum: ["item", "time", "cash", "bonus", "skill", "stat", "experience", "other", "person", "contact", "task", "job", "entertainment"] },
            reasonsToGive: { $ref: "#/$defs/IdArray" },
            location: { $ref: "#/$defs/LocationRef" },
            market: { $ref: "#/$defs/Id" },
            entity: { $ref: "#/$defs/Id" },
            tags: { $ref: "#/$defs/Tags" },
            usageLimit: { type: "number" },
            timeLimit: { $ref: "#/$defs/Timestamp" },
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            entityLocation: { $ref: "#/$defs/LocationRef" }
        },
        required: ["type", "entity"]
    },

    //
    reward: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: false,
        $defs: SHARED_DEFS,
        properties: {
            type: { enum: ["item", "cash", "bonus", "skill", "stat", "experience", "other", "person", "contact", "task", "job", "entertainment"] },
            requirements: { $ref: "#/$defs/IdArray" },
            location: { $ref: "#/$defs/LocationRef" },
            tags: { $ref: "#/$defs/Tags" },
            entity: { $ref: "#/$defs/Id" },
            usageLimit: { type: "number" },
            timeLimit: { $ref: "#/$defs/Timestamp" },
            description: DESCRIPTION_SCHEME,
            icon: ICON_SCHEME,
            image: { $ref: "#/$defs/Images" },
            entityLocation: { $ref: "#/$defs/LocationRef" }
        },
        required: ["type", "entity"]
    },

    // if entity is not specified, it's unknown
    unspecified: {
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
        },
        required: ["name"]
    }
};

//
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
        JSON_SCHEMES.event,
        JSON_SCHEMES.task,
        JSON_SCHEMES.item,
        JSON_SCHEMES.action,
        JSON_SCHEMES.entertainment,
        JSON_SCHEMES.bonus,
        JSON_SCHEMES.reward,
        JSON_SCHEMES.lottery,
        JSON_SCHEMES.fine,
        JSON_SCHEMES.unspecified,
        JSON_SCHEMES.factor
    ]
};
