//
// TypeScript declarations derived from JSON_SCHEMES (v1.0.0-pre)
//

// Shared primitives
export type Id = string | number;
export type IdArray = Id[] | number | number[];
export type Tags = string[];
export type Images = string[]; // URIs
export type Timestamp = number | string; // ISO date-time string allowed
export type DescriptionValue = string | string[] | any | any[] | unknown | unknown[];

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface Contact {
    name: string;
    phone?: string[];
    email?: string[];
}

export type LocationRef = Coordinates | Id;

export interface PrimaryDesc {
    name?: string;
    icon?: string;
    title?: string;
    tags?: Tags;
}

// Shared enums/unions
export type Availability = "public" | "everyone" | "members" | "private" | "other";
export type Permissions = Availability;
export type TaskStatus = "under_consideration" | "pending" | "in_progress" | "completed" | "failed" | "delayed" | "canceled" | "other";
export type Affect = "positive" | "negative" | "neutral";
export type VehicleRole = "driver" | "passenger" | "other";
export type VehicleRights = "own" | "rented" | "borrowed" | "service" | "free" | "other";
export type MarketPurpose = "entertainment" | "food" | "services" | "medical" | "electronics" | "furniture" | "specialized" | "professional" | "other";

// Kind unions by group (from KIND_MAP)
export type TaskKind = "target" | "complete" | "current" | "delayed" | "finished" | "canceled" | "planned" | "resolved" | "reviewed" | "assigned" | "proposed" | "suggested";
export type FactorKind = "weather" | "health" | "family" | "relationships" | "job" | "traffic" | "business" | "economy" | "politics" | "news" | "other";
export type LocationKind = "building" | "point" | "street" | "destination" | "address" | "other";
export type SkillKind = "skill" | "knowledge" | "ability" | "trait" | "experience" | "other";
export type VendorKind = "vendor" | "company" | "organization" | "institution" | "other";
export type MarketKind = "market" | "service" | "store" | "pharmacy" | "shop" | "mall" | "cafe" | "bar" | "restaurant" | "hotel" | "other";
export type PlaceKind = "placement" | "place" | "school" | "university" | "service" | "clinic" | "pharmacy" | "hospital" | "library" | "market" | "location" | "shop" | "restaurant" | "cafe" | "bar" | "hotel" | "other";
export type ServiceKind = "service" | "product" | "consultation" | "advice" | "medical" | "mentoring" | "training" | "item" | "thing" | "other";
export type PersonKind = "specialist" | "service" | "consultant" | "coach" | "mentor" | "dear" | "helper" | "assistant" | "friend" | "family" | "relative" | "other";
export type VehicleKind = "bus" | "trolleybus" | "boat" | "yacht" | "ship" | "scooter" | "bike" | "train" | "tram" | "auto" | "car" | "taxi" | "truck" | "airplane" | "helicopter" | "other";
export type EventKind = "education" | "lecture" | "conference" | "meeting" | "seminar" | "workshop" | "presentation" | "celebration" | "opening" | "other";
export type ItemKind = "currency" | "book" | "electronics" | "furniture" | "medicine" | "tools" | "software" | "consumables" | "other";
export type BonusKind = "cash-back" | "promo-code" | "loyalty-card" | "gift-card" | "discount" | "bonus-card" | "bonus-points" | "bonus-points-card" | "earn-points" | "earn-points-card";
export type LotteryKind = "lottery" | "raffle" | "draw" | "draw-lottery" | "draw-raffle" | "draw-lottery-raffle" | "draw-lottery-raffle-draw" | "draw-lottery-raffle-draw-draw-lottery" | "draw-lottery-raffle-draw-draw-raffle";
export type RewardKind = "item" | "cash" | "bonus" | "skill" | "stat" | "experience" | "person" | "contact" | "task" | "job" | "entertainment" | "other";
export type FineKind = "item" | "time" | "cash" | "bonus" | "skill" | "stat" | "experience" | "other" | "person" | "contact" | "task" | "job" | "entertainment";
export type ActionKind = "thinking" | "imagination" | "remembering" | "speaking" | "learning" | "listening" | "reading" | "writing" | "moving" | "traveling" | "speech" | "physically" | "crafting" | "following" | "other";
export type EntertainmentKind = "entertainment" | "sport" | "education" | "cinema" | "museum" | "hobby" | "drawing" | "reading" | "shopping" | "other";
export type UnknownKind = "unspecified" | "unknown" | "other";

//
export interface EntityDesc<K = string, P = string> {
    entityType: K;
    potentialName: P;
}

// Base entity
export interface EntityBase<K extends string, P = any> {
    desc?: PrimaryDesc;
    kind: K | K[];
    description?: DescriptionValue;
    properties: P;
}

// Task
export interface TaskProperties {
    status: TaskStatus;
    image?: Images;
    begin_time?: Timestamp;
    end_time?: Timestamp;
    location: LocationRef;
    contacts?: Contact;
    members?: IdArray;
    events?: IdArray;
    rewards?: IdArray;
    bonuses?: IdArray;
    actions?: IdArray;
    prices?: IdArray;
}

export interface Task extends EntityBase<TaskKind, TaskProperties> { }

// Factor
export interface FactorProperties {
    affect: Affect;
    actions?: IdArray;
    image?: Images;
    location?: LocationRef;
    begin_time?: Timestamp;
    end_time?: Timestamp;
    members?: IdArray;
}

export interface FactorEntity extends EntityBase<FactorKind, FactorProperties> { }

// Location
export interface LocationProperties {
    image?: Images;
    coordinates?: Coordinates;
    street?: string;
    house?: string;
    flat?: string;
    floor?: number;
    room?: number;
    square?: number;
    members?: IdArray;
    services?: IdArray;
    rewards?: IdArray;
    prices?: IdArray;
}

export interface LocationEntity extends EntityBase<LocationKind, LocationProperties> { }

// Skill
export interface SkillProperties {
    image?: Images;
    level?: number; // 0..100
    tasks?: IdArray;
    actions?: IdArray;
    bonuses?: IdArray;
    results?: string[];
    profession_related: IdArray;
}

export interface SkillEntity extends EntityBase<SkillKind, SkillProperties> { }

// Vendor
export interface VendorProperties {
    image?: Images;
    coordinates: Coordinates;
    members?: IdArray;
    services?: IdArray;
    feedbacks?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
}

export interface VendorEntity extends EntityBase<VendorKind, VendorProperties> { }

// Market
export interface MarketProperties {
    image?: Images;
    location?: LocationRef;
    members?: IdArray;
    services?: IdArray;
    feedbacks?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
    prices?: IdArray;
    purpose: MarketPurpose;
    permissions?: Permissions;
    availability?: Availability;
    availabilityTime?: string[]; // time strings
    availabilityDays?: string[];
}

export interface MarketEntity extends EntityBase<MarketKind, MarketProperties> { }

// Place
export interface PlaceProperties {
    image?: Images;
    coordinates: LocationRef;
    members?: IdArray;
    services?: IdArray;
    feedbacks?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
    prices?: IdArray;
    purpose?: MarketPurpose;
    permissions?: Permissions;
    availability?: Availability;
    availabilityTime?: string[];
    availabilityDays?: string[];
}

export interface PlaceEntity extends EntityBase<PlaceKind, PlaceProperties> { }

// Service
export interface ServiceProperties {
    image?: Images;
    whereIs?: string[];
    location: LocationRef;
    persons?: string[];
    contacts?: Contact;
    tasks?: IdArray;
    actions?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
    prices?: IdArray;
    feedbacks?: IdArray;
    quantity?: number;
}

export interface ServiceEntity extends EntityBase<ServiceKind, ServiceProperties> { }

// Person
export interface Biography {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    nickName?: string;
    birthdate?: string; // YYYY-MM-DD
    gender?: "male" | "female" | "other";
}

export interface PersonProperties {
    image?: Images;
    home?: LocationRef;
    jobs?: LocationRef[];
    tasks?: IdArray;
    contacts?: Contact;
    services?: IdArray;
    location: LocationRef;
    biography?: Biography;
    actions?: IdArray;
    feedbacks?: IdArray;
}

export interface PersonEntity extends EntityBase<PersonKind, PersonProperties> { }

// Vehicle
export interface VehicleProperties {
    image?: Images;
    role?: VehicleRole;
    rights?: VehicleRights;
    destination?: LocationRef;
    route?: IdArray;
    timeLimit?: Timestamp;
    location: LocationRef;
    services?: IdArray;
    contacts?: Contact;
    members?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
    feedbacks?: IdArray;
    description?: DescriptionValue;
    prices?: IdArray;
    quantity?: number;
}

export interface VehicleEntity extends EntityBase<VehicleKind, VehicleProperties> { }

// Event
export interface EventProperties {
    image?: Images;
    location: LocationRef;
    tasks?: IdArray;
    begin_time: Timestamp;
    end_time?: Timestamp;
    members?: IdArray;
    actions?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
    prices?: IdArray;
}

export interface EventEntity extends EntityBase<EventKind, EventProperties> { }

// Item
export interface ItemProperties {
    image?: Images;
    markets?: IdArray;
    location: LocationRef;
    contacts?: Contact;
    suitableFor?: IdArray;
    feedbacks?: IdArray;
    prices?: IdArray;
    quantity?: number;
}

export interface ItemEntity extends EntityBase<ItemKind, ItemProperties> { }

// Action
export interface ActionProperties {
    image?: Images;
    difficulty?: number;
    duration?: number;
    location: LocationRef;
    tasks?: IdArray;
    whatUsed?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
    prices?: IdArray;
}

export interface ActionEntity extends EntityBase<ActionKind, ActionProperties> { }

// Entertainment
export interface EntertainmentProperties {
    image?: Images;
    actions?: IdArray;
    persons?: IdArray;
    contacts?: Contact;
    location: LocationRef;
    begin_time?: Timestamp;
    end_time?: Timestamp;
    tasks?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
    feedbacks?: IdArray;
}

export interface EntertainmentEntity extends EntityBase<EntertainmentKind, EntertainmentProperties> { }

// Bonus
export interface BonusUsabilityKind {
    forEntity: Array<"item" | "service" | "entertainment" | "action">;
    inEntity: Array<"location" | "market" | "place" | "event" | "action" | "person">;
}

export interface BonusProperties {
    image?: Images;
    usableFor?: IdArray;
    usableIn?: IdArray;
    availability?: Availability;
    availabilityTime?: string[];
    availabilityDays?: string[];
    requirements?: IdArray;
    additionalProperties?: Record<string, unknown>;
    persons?: IdArray;
    actions?: IdArray;
    bonuses?: IdArray;
    rewards?: IdArray;
    contacts?: Contact;
    location: LocationRef; // required by schema
}

export interface BonusEntity extends EntityBase<BonusKind, BonusProperties> {
    usabilityKind?: BonusUsabilityKind[] | BonusUsabilityKind;
}

// Lottery
export interface LotteryProperties {
    requirements: IdArray;
    chance: number; // 0..100
    image?: Images;
    location: LocationRef;
    usageLimit?: number;
    timeLimit?: Timestamp;
    rewards?: IdArray;
    bonuses?: IdArray;
    prices?: IdArray;
}

export interface LotteryEntity extends EntityBase<LotteryKind, LotteryProperties> { }

// Fine
export interface FineProperties {
    reasonsToGive?: IdArray;
    location: LocationRef;
    entity: Id;
    usageLimit?: number;
    timeLimit?: Timestamp;
    image?: Images;
    entityLocation?: LocationRef;
}

export interface FineEntity extends EntityBase<FineKind, FineProperties> { }

// Reward
export interface RewardProperties {
    requirements?: IdArray;
    location: LocationRef;
    usageLimit?: number;
    timeLimit?: Timestamp;
    image?: Images;
    entityLocation?: LocationRef;
}

export interface RewardEntity extends EntityBase<RewardKind, RewardProperties> { }

// Unknown
export interface UnknownProperties {
    image?: Images;
    location?: LocationRef;
    suggestedKind?: string;
}

export interface UnknownEntity extends EntityBase<UnknownKind, UnknownProperties> { }

// Unions
export type Entity =
    | LocationEntity
    | VendorEntity
    | MarketEntity
    | PlaceEntity
    | ServiceEntity
    | PersonEntity
    | VehicleEntity
    | EventEntity
    | ItemEntity
    | ActionEntity
    | EntertainmentEntity
    | BonusEntity
    | RewardEntity
    | LotteryEntity
    | FineEntity
    | UnknownEntity
    | FactorEntity
    | SkillEntity;

export type AIEntity =
    | LocationEntity
    | VendorEntity
    | MarketEntity
    | PlaceEntity
    | ServiceEntity
    | PersonEntity
    | VehicleEntity
    | EventEntity
    | ItemEntity
    | ActionEntity
    | EntertainmentEntity
    | BonusEntity
    | RewardEntity
    | LotteryEntity
    | FineEntity
    | UnknownEntity
    | FactorEntity;

export interface AIOutput {
    task: Task;
    entity: AIEntity;
}
