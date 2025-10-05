enum ENTITY_TYPE {
    TASK = "task",
    EVENT = "event",
    ACTION = "action",
    SERVICE = "service",
    ITEM = "item",
    SKILL = "skill",
}

//
enum ENTITY_KIND { };
enum VENDOR_KIND {
    VENDOR = "vendor",
    COMPANY = "company",
    ORGANIZATION = "organization",
    INSTITUTION = "institution",
}

//
enum PLACE_KIND {
    PLACEMENT = "placement",
    PLACE = "place",
    SCHOOL = "school",
    UNIVERSITY = "university",
}

//
enum FACTOR_KIND {
    WEATHER = "weather",
    HEALTH = "health",
    FAMILY = "family",
    RELATIONSHIPS = "relationships",
}

//
enum PERSON_KIND {
    SPECIALIST = "specialist",
    CONSULTANT = "consultant",
    COACH = "coach",
    MENTOR = "mentor",
    DEAR = "dear",
}

//
enum SERVICE_KIND {
    PRODUCT = "product",
    CONSULTATION = "consultation",
    ADVICE = "advice",
    MEDICAL = "medical",
}

//
enum ITEM_KIND {
    CURRENCY = "currency",
    BOOK = "book",
    ELECTRONICS = "electronics",
    FURNITURE = "furniture",
}

//
enum SKILL_KIND {
    SKILL = "skill",
    KNOWLEDGE = "knowledge",
    ABILITY = "ability",
    TRAIT = "trait",
}



// unknown but base
interface PropBase {
}

//
interface EntityInterface<T extends PropBase, K extends (ENTITY_KIND | VENDOR_KIND | PLACE_KIND | FACTOR_KIND | PERSON_KIND | SERVICE_KIND | ITEM_KIND | SKILL_KIND)> {
    id: string;
    type: T;
    kind: K;
    name: string;
    title: string;
    properties: T;
}

//
interface OtherInterface extends PropBase {
    [key: string]: Record<string, any>;
}

//
interface PersonInterface extends PropBase {
    home: string;
    jobs: string[];
    biography: string;
    contacts: string;
    services: string[];
}

//
interface TaskInterface extends PropBase {
    status: string;
    begin_time: string;
    end_time: string;
    location: string;
    contacts: string;
    members: string[];
    events: string[];
}

//
interface EventInterface extends PropBase {
    begin_time: string;
    end_time: string;
    location: string;
    contacts: string;
}

//
interface ActionInterface extends PropBase {
    affect: string;
}

//
interface ServiceInterface extends PropBase {
    location: string;
    persons: string[];
    specialization: string[];
    contacts: string;
}

//
interface SkillInterface extends PropBase {
    level: string;
    category: string[];
    related: string[];
}

//
interface ItemInterface extends PropBase {
    price: number;
    quantity: number;
    availability: string[];
    attributes: Record<string, any>;
}

//
interface BonusInterface extends PropBase {
    code: string;
    usableFor: string[];
    usableIn: string[];
    availability: {
        count: number;
        time: string[];
        days: string[];
    };
}
