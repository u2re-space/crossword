import { GPTResponses, encode, parseAIResponseSafe } from './GPT-Responses.js';
import { MAX_BASE64_SIZE, convertImageToJPEG, BASE64_PREFIX, DEFAULT_ENTITY_TYPE } from './ImageProcess.js';
import { JSOX, writeFileSmart, getDirectoryHandle, getFileHandle, parseDataUrl, stringToFile, decodeBase64ToBytes, observe, iterated, safe, loadSettings } from './Settings.js';
import { Promised } from './index.js';
import { showSuccess, showError } from './Toast.js';
import { canParseURL } from './Runtime2.js';

"use strict";
const DB_NAME = "req-queue";
const STORE$1 = "queue";
const DB_VERSION = 3;
function idbOpen$1() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(STORE$1)) db.deleteObjectStore(STORE$1);
      const store = db.createObjectStore(STORE$1, { keyPath: "id", autoIncrement: true });
      store.createIndex("byLockedId", ["locked", "id"], { unique: false });
      store.createIndex("byLockedAt", "lockedAt", { unique: false });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
function withTx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE$1, mode);
    const store = tx.objectStore(STORE$1);
    let done = false;
    const finish = (err, val) => {
      if (done) return;
      done = true;
      err ? reject(err) : resolve(val);
    };
    Promise.resolve().then(() => fn(store)).then((result) => {
      tx.oncomplete = () => finish(void 0, result);
      tx.onerror = () => finish(tx.error || new Error("Transaction error"));
      tx.onabort = () => finish(tx.error || new Error("Transaction aborted"));
    }).catch((e) => {
      try {
        tx.abort();
      } catch {
      }
      finish(e);
    });
  });
}
async function pushOne(payload) {
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readwrite", async (store) => {
      const rec = {
        payload,
        enqueuedAt: Date.now(),
        locked: false,
        lockedAt: null
      };
      const req = store.add(rec);
      return await new Promise((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
    });
  } finally {
    db.close();
  }
}
async function pushMany(payloads) {
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readwrite", async (store) => {
      const ids = [];
      for (const p of payloads) {
        const rec = {
          payload: p,
          enqueuedAt: Date.now(),
          locked: false,
          lockedAt: null
        };
        const req = store.add(rec);
        const id = await new Promise((res, rej) => {
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        });
        ids.push(id);
      }
      return ids;
    });
  } finally {
    db.close();
  }
}
async function size() {
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readonly", async (store) => {
      const req = store.count();
      return await new Promise((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
    });
  } finally {
    db.close();
  }
}
async function peek(limit = 50) {
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readonly", async (store) => {
      const result = [];
      const idx = store.index("byLockedId");
      const range = IDBKeyRange.bound([false, -Infinity], [false, Infinity]);
      return await new Promise((res, rej) => {
        const curReq = idx.openCursor(range, "next");
        curReq.onerror = () => rej(curReq.error);
        curReq.onsuccess = () => {
          const cursor = curReq.result;
          if (!cursor || result.length >= limit) return res(result);
          result.push(cursor.value);
          cursor.continue();
        };
      });
    });
  } finally {
    db.close();
  }
}
async function unlockExpired(store, cutoff) {
  const idx = store.index("byLockedAt");
  const range = IDBKeyRange.upperBound(cutoff, true);
  await new Promise((res, rej) => {
    const curReq = idx.openCursor(range);
    curReq.onerror = () => rej(curReq.error);
    curReq.onsuccess = () => {
      const cursor = curReq.result;
      if (!cursor) return res();
      const rec = cursor.value;
      if (rec.locked && typeof rec.lockedAt === "number" && rec.lockedAt < cutoff) {
        rec.locked = false;
        rec.lockedAt = null;
        const putReq = cursor.update(rec);
        putReq.onerror = () => rej(putReq.error);
        putReq.onsuccess = () => cursor.continue();
      } else {
        cursor.continue();
      }
    };
  });
}
async function claimBatch(limit = 50, lockMs = 5 * 6e4) {
  const now = Date.now();
  const cutoff = now - lockMs;
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readwrite", async (store) => {
      await unlockExpired(store, cutoff);
      const idx = store.index("byLockedId");
      const range = IDBKeyRange.bound([false, -Infinity], [false, Infinity]);
      const claimed = [];
      await new Promise((res, rej) => {
        const curReq = idx.openCursor(range, "next");
        curReq.onerror = () => rej(curReq.error);
        curReq.onsuccess = () => {
          const cursor = curReq.result;
          if (!cursor || claimed.length >= limit) return res();
          const rec = cursor.value;
          rec.locked = true;
          rec.lockedAt = now;
          const putReq = cursor.update(rec);
          putReq.onerror = () => rej(putReq.error);
          putReq.onsuccess = () => {
            claimed.push(rec);
            cursor.continue();
          };
        };
      });
      return claimed;
    });
  } finally {
    db.close();
  }
}
async function ack(ids) {
  if (!ids.length) return;
  const db = await idbOpen$1();
  try {
    await withTx(db, "readwrite", async (store) => {
      for (const id of ids) {
        const req = store.delete(id);
        await new Promise((res, rej) => {
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        });
      }
    });
  } finally {
    db.close();
  }
}
async function nack(ids) {
  if (!ids.length) return;
  const db = await idbOpen$1();
  try {
    await withTx(db, "readwrite", async (store) => {
      for (const id of ids) {
        const getReq = store.get(id);
        const rec = await new Promise((res, rej) => {
          getReq.onsuccess = () => res(getReq.result);
          getReq.onerror = () => rej(getReq.error);
        });
        if (!rec) continue;
        rec.locked = false;
        rec.lockedAt = null;
        const putReq = store.put(rec);
        await new Promise((res, rej) => {
          putReq.onsuccess = () => res();
          putReq.onerror = () => rej(putReq.error);
        });
      }
    });
  } finally {
    db.close();
  }
}
async function dumpAll(full = false) {
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readonly", async (store) => {
      const req = store.getAll();
      return await new Promise((res, rej) => {
        req.onsuccess = () => {
          const arr = req.result;
          res(full ? arr : arr.map((r) => r.payload));
        };
        req.onerror = () => rej(req.error);
      });
    });
  } finally {
    db.close();
  }
}
async function loadFromArray(payloads) {
  return pushMany(payloads);
}
async function drain(handler, opts) {
  const batchSize = opts?.batchSize ?? 50;
  const lockMs = opts?.lockMs ?? 5 * 6e4;
  const stopOnEmpty = opts?.stopOnEmpty ?? true;
  while (true) {
    const batch = await claimBatch(batchSize, lockMs);
    if (batch.length === 0) {
      if (stopOnEmpty) return;
      await new Promise((r) => setTimeout(r, 1e3));
      continue;
    }
    const ids = batch.map((r) => r.id);
    try {
      await handler(batch.map((r) => r.payload), batch);
      await ack(ids);
    } catch (e) {
      await nack(ids);
      throw e;
    }
  }
}
async function dumpAndClear(full = false) {
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readwrite", async (store) => {
      const all = await new Promise((res, rej) => {
        const req = store.getAll();
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
      await new Promise((res, rej) => {
        const req = store.clear();
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
      return full ? all : all.map((r) => r.payload);
    });
  } finally {
    db.close();
  }
}
async function popAllUnlocked(full = false) {
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readwrite", async (store) => {
      const out = [];
      const idx = store.index("byLockedId");
      const range = IDBKeyRange.bound([false, -Infinity], [false, Infinity]);
      await new Promise((res, rej) => {
        const curReq = idx.openCursor(range, "next");
        curReq.onerror = () => rej(curReq.error);
        curReq.onsuccess = () => {
          const cursor = curReq.result;
          if (!cursor) return res();
          const rec = cursor.value;
          out.push(rec);
          const delReq = cursor.delete();
          delReq.onerror = () => rej(delReq.error);
          delReq.onsuccess = () => cursor.continue();
        };
      });
      return full ? out : out.map((r) => r.payload);
    });
  } finally {
    db.close();
  }
}
async function prune(maxAgeMs = 7 * 24 * 60 * 60 * 1e3) {
  const now = Date.now();
  const cutoff = now - maxAgeMs;
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readwrite", async (store) => {
      let count = 0;
      const req = store.openCursor();
      await new Promise((res, rej) => {
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) return res();
          const rec = cursor.value;
          if (rec.enqueuedAt < cutoff) {
            cursor.delete();
            count++;
          }
          cursor.continue();
        };
        req.onerror = () => rej(req.error);
      });
      return count;
    });
  } finally {
    db.close();
  }
}
async function deduplicate() {
  const db = await idbOpen$1();
  try {
    return await withTx(db, "readwrite", async (store) => {
      const hashes = /* @__PURE__ */ new Set();
      let count = 0;
      const req = store.openCursor();
      await new Promise((res, rej) => {
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) return res();
          const rec = cursor.value;
          try {
            const hash = JSOX.stringify(rec.payload);
            if (hashes.has(hash)) {
              cursor.delete();
              count++;
            } else {
              hashes.add(hash);
            }
          } catch (e) {
          }
          cursor.continue();
        };
        req.onerror = () => rej(req.error);
      });
      return count;
    });
  } finally {
    db.close();
  }
}

"use strict";
const optionize = (values) => (values ?? []).map((value) => value);
const locationField = (name, path, section = "relations", label = "Location", helper) => ({
  name,
  label,
  path,
  section,
  textarea: true,
  helper: helper ?? "String or JSON representation of the location"
});
const contactFields = (basePath) => [
  {
    name: "contacts.email",
    label: "Emails",
    path: `${basePath}.email`,
    section: "contacts",
    textarea: true,
    helper: "One email per line",
    multi: true
  },
  {
    name: "contacts.phone",
    label: "Phones",
    path: `${basePath}.phone`,
    section: "contacts",
    textarea: true,
    helper: "One phone per line",
    multi: true
  },
  {
    name: "contacts.links",
    label: "Links",
    path: `${basePath}.links`,
    section: "contacts",
    textarea: true,
    helper: "One link per line",
    multi: true
  }
];
const selectField = (name, label, path, options, section = "properties", helper) => ({
  name,
  label,
  path,
  section,
  helper,
  options: optionize(options)
});
const COLOR_OPTIONS = [
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "brown",
  "gray",
  "black",
  "white"
];
const TASK_STATUS_OPTIONS = [
  "under_consideration",
  "pending",
  "in_progress",
  "completed",
  "failed",
  "delayed",
  "canceled",
  "other"
];
const AFFECT_OPTIONS = ["positive", "negative", "neutral"];
const GENDER_OPTIONS = ["male", "female", "other"];
const dateStructFields = (name, label, basePath, section = "schedule") => [
  {
    name: `${name}.date`,
    label: `${label} (Date)`,
    path: `${basePath}.date`,
    section,
    placeholder: "YYYY-MM-DD"
  },
  {
    name: `${name}.iso_date`,
    label: `${label} (ISO)`,
    path: `${basePath}.iso_date`,
    section,
    placeholder: "YYYY-MM-DDTHH:MM",
    helper: "ISO 8601 date-time"
  },
  {
    name: `${name}.timestamp`,
    label: `${label} (Timestamp)`,
    path: `${basePath}.timestamp`,
    section,
    numeric: true,
    type: "number",
    helper: "Unix milliseconds"
  }
];
const arrayField = (name, label, path, section = "relations", helper) => ({
  name,
  label,
  path,
  section,
  textarea: true,
  multi: true,
  helper
});
const jsonField = (name, label, path, section = "properties", helper) => ({
  name,
  label,
  path,
  section,
  json: true,
  textarea: true,
  helper
});
const stringField = (name, label, path, section = "properties", placeholder, helper) => ({
  name,
  label,
  path,
  section,
  placeholder,
  helper
});
const numberField = (name, label, path, section = "properties", helper) => ({
  name,
  label,
  path,
  section,
  numeric: true,
  type: "number",
  helper
});
const biographyFields = (basePath) => [
  {
    name: "biography.firstName",
    label: "First name",
    path: `${basePath}.firstName`,
    section: "main"
  },
  {
    name: "biography.lastName",
    label: "Last name",
    path: `${basePath}.lastName`,
    section: "main"
  },
  {
    name: "biography.middleName",
    label: "Middle name",
    path: `${basePath}.middleName`,
    section: "main"
  },
  {
    name: "biography.nickName",
    label: "Nick name",
    path: `${basePath}.nickName`,
    section: "main"
  },
  {
    name: "biography.birthdate",
    label: "Birth date",
    path: `${basePath}.birthdate`,
    section: "meta",
    placeholder: "YYYY-MM-DD or ISO date"
  },
  selectField("biography.gender", "Gender", `${basePath}.gender`, GENDER_OPTIONS, "meta")
];
const BASE_ENTITY_FIELD_RULES = [
  {
    name: "id",
    label: "Identifier",
    path: "id",
    section: "main",
    placeholder: "unique-id-or-code",
    helper: "Stable unique identifier"
  },
  {
    name: "name",
    label: "Name",
    path: "name",
    section: "main",
    placeholder: "machine-name",
    helper: "Lowercase machine-readable name"
  },
  {
    name: "title",
    label: "Title",
    path: "title",
    section: "main",
    placeholder: "Human readable name",
    helper: "Shown in cards and lists"
  },
  {
    name: "kind",
    label: "Kind",
    path: "kind",
    section: "main",
    helper: "Determines category-specific behaviour"
  },
  {
    name: "description",
    label: "Description",
    path: "description",
    section: "main",
    textarea: true,
    helper: "Markdown supported"
  },
  selectField("variant", "Variant", "variant", COLOR_OPTIONS, "meta", "Visual accent colour"),
  {
    name: "icon",
    label: "Icon",
    path: "icon",
    section: "meta",
    placeholder: "phosphor/name"
  },
  {
    name: "image",
    label: "Image",
    path: "image",
    section: "meta",
    placeholder: "https://example.com/image.jpg"
  },
  {
    name: "tags",
    label: "Tags",
    path: "tags",
    section: "meta",
    textarea: true,
    helper: "One tag per line",
    multi: true
  }
];
const FIELD_ALIASES = {
  title: "title",
  kind: "kind",
  name: "name",
  id: "id",
  price: "properties.price",
  quantity: "properties.quantity",
  begin_time: "properties.begin_time",
  end_time: "properties.end_time",
  email: "properties.contacts.email",
  phone: "properties.contacts.phone",
  links: "properties.contacts.links",
  "contacts.email": "properties.contacts.email",
  "contacts.phone": "properties.contacts.phone",
  "contacts.links": "properties.contacts.links"
};
const LEGACY_PROPERTY_RULES = {
  price: numberField("price", "Price", "properties.price", "properties", "Price as number"),
  quantity: numberField("quantity", "Quantity", "properties.quantity"),
  begin_time: stringField("begin_time", "Begin", "properties.begin_time", "schedule", "YYYY-MM-DD or ISO string"),
  end_time: stringField("end_time", "End", "properties.end_time", "schedule", "YYYY-MM-DD or ISO string"),
  location: locationField("location", "properties.location"),
  services: arrayField("services", "Services", "properties.services", "relations", "Service IDs, one per line"),
  members: arrayField("members", "Members", "properties.members", "relations", "Member IDs, one per line"),
  actions: arrayField("actions", "Actions", "properties.actions", "relations", "Action IDs, one per line"),
  bonuses: arrayField("bonuses", "Bonuses", "properties.bonuses", "properties", "Bonus IDs, one per line"),
  rewards: arrayField("rewards", "Rewards", "properties.rewards", "properties", "Reward IDs, one per line"),
  feedbacks: arrayField("feedbacks", "Feedbacks", "properties.feedbacks", "properties", "Feedback IDs, one per line"),
  tasks: arrayField("tasks", "Tasks", "properties.tasks", "relations", "Task IDs, one per line"),
  persons: arrayField("persons", "Persons", "properties.persons", "relations", "Person IDs, one per line"),
  events: arrayField("events", "Events", "properties.events", "relations", "Event IDs, one per line"),
  image: arrayField("image", "Images", "properties.image", "properties", "Image URLs, one per line"),
  availability: stringField("availability", "Availability", "properties.availability", "properties"),
  availabilityTime: arrayField("availabilityTime", "Availability time", "properties.availabilityTime", "properties", "Time ranges, one per line"),
  availabilityDays: arrayField("availabilityDays", "Availability days", "properties.availabilityDays", "properties", "Day names, one per line"),
  permissions: stringField("permissions", "Permissions", "properties.permissions", "properties"),
  purpose: stringField("purpose", "Purpose", "properties.purpose", "properties"),
  home: locationField("home", "properties.home"),
  jobs: arrayField("jobs", "Jobs", "properties.jobs", "relations", "Job IDs, one per line"),
  coordinates: jsonField("coordinates", "Coordinates", "properties.coordinates", "properties", "JSON object with latitude and longitude")
};
const ENTITY_KIND_MAP = {
  task: ["job", "action", "other"],
  event: [
    "education",
    "lecture",
    "conference",
    "meeting",
    "seminar",
    "workshop",
    "presentation",
    "celebration",
    "opening",
    "other"
  ],
  action: [
    "thinking",
    "imagination",
    "remembering",
    "speaking",
    "learning",
    "listening",
    "reading",
    "writing",
    "moving",
    "traveling",
    "speech",
    "physically",
    "crafting",
    "following",
    "other"
  ],
  service: ["product", "consultation", "advice", "medical", "mentoring", "training", "item", "thing", "other"],
  item: ["currency", "book", "electronics", "furniture", "medicine", "tools", "software", "consumables", "other"],
  skill: ["skill", "knowledge", "ability", "trait", "experience", "other"],
  vendor: ["vendor", "company", "organization", "institution", "other"],
  place: [
    "placement",
    "place",
    "school",
    "university",
    "service",
    "clinic",
    "pharmacy",
    "hospital",
    "library",
    "market",
    "location",
    "shop",
    "restaurant",
    "cafe",
    "bar",
    "hotel",
    "other"
  ],
  factor: ["weather", "health", "family", "relationships", "job", "traffic", "business", "economy", "politics", "news", "other"],
  person: ["specialist", "consultant", "coach", "mentor", "dear", "helper", "assistant", "friend", "family", "relative", "other"],
  bonus: []
};
const ENTITY_SCHEMAS = {
  task: {
    kind: ENTITY_KIND_MAP.task,
    fields: [
      selectField("status", "Status", "properties.status", TASK_STATUS_OPTIONS, "properties", "Task state"),
      ...dateStructFields("begin_time", "Begin", "properties.begin_time"),
      ...dateStructFields("end_time", "End", "properties.end_time"),
      locationField("location", "properties.location"),
      ...contactFields("properties.contacts"),
      arrayField("members", "Members", "properties.members", "relations", "Entity IDs, one per line"),
      arrayField("events", "Events", "properties.events", "relations", "Event IDs, one per line")
    ]
  },
  event: {
    kind: ENTITY_KIND_MAP.event,
    fields: [
      ...dateStructFields("begin_time", "Begin", "properties.begin_time"),
      ...dateStructFields("end_time", "End", "properties.end_time"),
      locationField("location", "properties.location"),
      ...contactFields("properties.contacts")
    ]
  },
  action: {
    kind: ENTITY_KIND_MAP.action,
    fields: [
      stringField("affect", "Affect", "properties.affect", "properties", "Describe impact or affect"),
      arrayField("steps", "Steps", "properties.steps", "properties", "Action steps, one per line"),
      arrayField("related", "Related", "properties.related", "relations", "Related entity IDs, one per line")
    ]
  },
  service: {
    kind: ENTITY_KIND_MAP.service,
    fields: [
      locationField("location", "properties.location"),
      arrayField("persons", "Persons", "properties.persons", "relations", "Person IDs, one per line"),
      arrayField("specialization", "Specializations", "properties.specialization", "properties", "Specializations, one per line"),
      ...contactFields("properties.contacts"),
      jsonField("prices", "Prices", "properties.prices", "properties", "JSON map: service => price")
    ]
  },
  item: {
    kind: ENTITY_KIND_MAP.item,
    fields: [
      numberField("price", "Price", "properties.price", "properties", "Price as number"),
      numberField("quantity", "Quantity", "properties.quantity"),
      arrayField("availability", "Availability", "properties.availability", "properties", "Availability notes, one per line"),
      jsonField("attributes", "Attributes", "properties.attributes", "properties", "Additional item attributes in JSON")
    ]
  },
  skill: {
    kind: ENTITY_KIND_MAP.skill,
    fields: [
      stringField("level", "Level", "properties.level", "properties", "e.g. beginner, intermediate"),
      arrayField("category", "Categories", "properties.category", "properties", "Categories, one per line"),
      arrayField("related", "Related", "properties.related", "relations", "Related skill or entity IDs")
    ]
  },
  vendor: {
    kind: ENTITY_KIND_MAP.vendor,
    fields: [
      locationField("location", "properties.location"),
      ...contactFields("properties.contacts"),
      arrayField("services", "Services", "properties.services", "relations", "Service IDs, one per line")
    ]
  },
  place: {
    kind: ENTITY_KIND_MAP.place,
    fields: [
      locationField("location", "properties.location", "properties"),
      arrayField("services", "Services", "properties.services", "relations", "Related service IDs"),
      ...contactFields("properties.contacts")
    ]
  },
  factor: {
    kind: ENTITY_KIND_MAP.factor,
    fields: [
      selectField("affect", "Affect", "properties.affect", AFFECT_OPTIONS, "properties", "Overall impact"),
      arrayField("actions", "Actions", "properties.actions", "relations", "Action IDs, one per line"),
      locationField("location", "properties.location", "properties")
    ]
  },
  person: {
    kind: ENTITY_KIND_MAP.person,
    fields: [
      locationField("home", "properties.home", "properties", "Home location"),
      arrayField("jobs", "Jobs", "properties.jobs", "properties", "Job locations, one per line"),
      ...biographyFields("properties.biography"),
      arrayField("tasks", "Tasks", "properties.tasks", "relations", "Task IDs, one per line"),
      ...contactFields("properties.contacts"),
      arrayField("services", "Services", "properties.services", "relations", "Service IDs, one per line"),
      jsonField("prices", "Prices", "properties.prices", "properties", "JSON map: service => price")
    ]
  },
  bonus: {
    kind: ENTITY_KIND_MAP.bonus,
    fields: [
      stringField("code", "Code", "properties.code", "properties", "Readable bonus code"),
      arrayField("usableFor", "Usable for", "properties.usableFor", "relations", "Entity IDs, one per line"),
      arrayField("usableIn", "Usable in", "properties.usableIn", "relations", "Location IDs, one per line"),
      numberField("availability.count", "Availability count", "properties.availability.count", "properties"),
      arrayField("availability.time", "Availability time", "properties.availability.time", "properties", "Time ranges, one per line"),
      arrayField("availability.days", "Availability days", "properties.availability.days", "properties", "Day names, one per line"),
      jsonField("requirements", "Requirements", "properties.requirements", "properties", "JSON array of requirements"),
      jsonField("additionalProperties", "Additional properties", "properties.additionalProperties", "properties", "JSON map of extra properties"),
      jsonField("profits", "Profits", "properties.profits", "properties", "JSON map: target => profit value")
    ]
  }
};
const detectEntityTypeByJSON = (unknownJSON) => {
  let mostSuitableType = "unknown";
  unknownJSON = typeof unknownJSON == "string" ? JSOX.parse(unknownJSON) : unknownJSON;
  if (typeof unknownJSON != "object") {
    return mostSuitableType;
  }
  if (unknownJSON.type && unknownJSON.properties && unknownJSON.kind) return unknownJSON.type;
  let types = /* @__PURE__ */ new Set();
  for (const type in ENTITY_KIND_MAP) {
    if (ENTITY_KIND_MAP[type].includes(unknownJSON.kind)) {
      types.add(type);
    }
  }
  const allEntities = [...Object.entries(ENTITY_SCHEMAS)]?.filter?.(([key, _]) => types.has(key));
  let timeTypes = /* @__PURE__ */ new Set();
  if (unknownJSON?.properties?.begin_time != null || unknownJSON?.properties?.end_time != null) {
    allEntities?.forEach(([type, scheme]) => {
      if (scheme.properties?.begin_time != null && scheme.properties?.end_time != null) {
        timeTypes.add(type);
      }
    });
  }
  let locationTypes = /* @__PURE__ */ new Set();
  if (unknownJSON?.properties?.location != null) {
    allEntities?.forEach(([type, scheme]) => {
      if (scheme.properties?.location != null) {
        locationTypes.add(type);
      }
    });
  }
  let pricesTypes = /* @__PURE__ */ new Set();
  if (unknownJSON?.properties?.prices != null) {
    allEntities?.forEach(([type, scheme]) => {
      if (scheme.properties?.prices != null) {
        pricesTypes.add(type);
      }
    });
  }
  let contactsTypes = /* @__PURE__ */ new Set();
  if (unknownJSON?.properties?.contacts != null) {
    allEntities?.forEach(([type, scheme]) => {
      if (scheme.properties?.contacts != null) {
        contactsTypes.add(type);
      }
    });
  }
  const countMap = /* @__PURE__ */ new Map();
  [...contactsTypes, ...locationTypes, ...pricesTypes, ...timeTypes].forEach((type) => {
    countMap.set(type, (countMap.get(type) || 0) + 1);
  });
  mostSuitableType = countMap.size == 0 ? [...types]?.[0] : [...countMap.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0];
  return mostSuitableType || "unknown";
};
const detectEntityTypesByJSONs = (unknownJSONs) => {
  unknownJSONs = typeof unknownJSONs == "string" ? JSOX.parse(unknownJSONs) : unknownJSONs;
  return Array.isArray(unknownJSONs) ? unknownJSONs?.map?.((unknownJSON) => detectEntityTypeByJSON(unknownJSON)) || [] : [detectEntityTypeByJSON(unknownJSONs)];
};

"use strict";
function parseDateCorrectly$1(str) {
  if (str == null) return null;
  if (str instanceof Date) return Number.isFinite(str.getTime()) ? str : null;
  if (typeof str === "number") {
    const d = new Date(str);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  if (typeof str === "object") {
    const anyObj = str;
    if (anyObj.timestamp != null) return parseDateCorrectly$1(anyObj.timestamp);
    if (anyObj.iso_date != null) return parseDateCorrectly$1(anyObj.iso_date);
    if (anyObj.date != null) return parseDateCorrectly$1(anyObj.date);
  }
  if (typeof str === "string") {
    const trimmed = str.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      const d2 = new Date(num);
      if (Number.isFinite(d2.getTime())) return d2;
    }
    const d = new Date(trimmed);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  return null;
}
function parseAndGetCorrectTime$1(str) {
  return parseDateCorrectly$1(str)?.getTime?.() ?? Date.now();
}
const DEFAULT_MAX_LENGTH = 96;
const CODE_SUFFIX_PREFIX = "CODE";
const BASIC_ALLOWED_PATTERN = /^[a-z0-9\-_&#\+]+$/;
const CODE_ALLOWED_PATTERN = /^[a-z0-9\-_&#\+]+(?:_CODE[0-9A-Z]*)?$/;
const removeDiacritics = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
const toStringOrNull = (value) => {
  if (value == null) return null;
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return null;
};
const slugifySegment = (segment) => {
  if (!segment) return "";
  const withoutDiacritics = removeDiacritics(segment);
  const lowercase = withoutDiacritics.toLowerCase();
  const collapsedWhitespace = lowercase.replace(/[\s]+/g, "-");
  const sanitized = collapsedWhitespace.replace(/[^a-z0-9\-_&#\+]+/g, "-");
  const condensedHyphen = sanitized.replace(/-{2,}/g, "-").replace(/_{2,}/g, "_");
  const trimmed = condensedHyphen.replace(/^-+|-+$/g, "").replace(/^_+|_+$/g, "");
  return trimmed;
};
const sanitizeCodeSuffix = (rawCode) => {
  const asString = toStringOrNull(rawCode);
  if (!asString) return "";
  const normalized = removeDiacritics(asString).replace(/\s+/g, "");
  const sanitized = normalized.replace(/[^A-Za-z0-9\-_&#\+]+/g, "");
  if (!sanitized) return "";
  const upper = sanitized.toUpperCase();
  return upper.startsWith(CODE_SUFFIX_PREFIX) ? upper : `${CODE_SUFFIX_PREFIX}${upper}`;
};
const isCodeSuffixAllowed = (entity) => {
  if (!entity) return false;
  if (entity.type === "bonus") return true;
  const code = entity?.properties && entity.properties?.code;
  return typeof code === "string" && code.trim().length > 0;
};
const extractLocationName = (value) => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const address = value.address;
    if (typeof address === "string") return address;
    if (address && typeof address === "object") {
      const parts = [];
      ["street", "house", "flat", "room"].forEach((key) => {
        const part = toStringOrNull(address[key]);
        if (part) parts.push(part);
      });
      if (parts.length > 0) return parts.join("-");
    }
    const coordinate = value.coordinate;
    if (coordinate && typeof coordinate === "object") {
      const lat = toStringOrNull(coordinate.latitude);
      const lon = toStringOrNull(coordinate.longitude);
      if (lat && lon) return `${lat}-${lon}`;
    }
    const name = toStringOrNull(value.name);
    if (name) return name;
    const title = toStringOrNull(value.title);
    if (title) return title;
  }
  return null;
};
const pushSegment = (collector, value) => {
  if (value == null) return;
  if (Array.isArray(value)) {
    value.forEach((item) => pushSegment(collector, item));
    return;
  }
  const stringValue = typeof value === "object" ? extractLocationName(value) : toStringOrNull(value);
  const slug = slugifySegment(stringValue);
  if (slug) collector.add(slug);
};
const prepareExistingSet = (existing) => {
  if (!existing) return void 0;
  if (existing instanceof Set) return existing;
  return new Set(existing);
};
const composeId = (base, codeSuffix, numericSuffix) => {
  const suffixPart = numericSuffix != null ? `-${numericSuffix}` : "";
  if (codeSuffix) {
    if (base) return `${base}_${codeSuffix}${suffixPart}`;
    return `${codeSuffix}${suffixPart}`;
  }
  return `${base}${suffixPart}`;
};
const clampBaseLength = (base, maxLength, reservedLength) => {
  if (!base) return base;
  if (base.length + reservedLength <= maxLength) return base;
  const available = Math.max(0, maxLength - reservedLength);
  if (available === 0) return "";
  const truncated = base.slice(0, available);
  return truncated.replace(/[-_]+$/g, "");
};
const ensureUniqueId = (base, codeSuffix, existing, maxLength) => {
  const initial = composeId(base, codeSuffix);
  if (!existing || !existing.has(initial)) return initial;
  let attempt = 2;
  while (attempt < 1e4) {
    const candidate = composeId(base, codeSuffix, attempt);
    if (!existing.has(candidate)) return candidate;
    attempt += 1;
  }
  return initial;
};
const sanitizeExistingIdValue = (value, allowCodeSuffix, maxLength) => {
  if (!value) return "";
  let working = removeDiacritics(value);
  working = working.replace(/[\s]+/g, "-");
  let codeSuffix = "";
  if (allowCodeSuffix) {
    const match = working.match(/(_CODE[0-9A-Za-z]*)$/i);
    if (match) {
      codeSuffix = sanitizeCodeSuffix(match[0].slice(1));
      working = working.slice(0, match.index ?? 0);
    }
  }
  const base = slugifySegment(working);
  const sanitizedBase = base ? base : "";
  if (!sanitizedBase && !codeSuffix) return "";
  const reservedLength = codeSuffix ? codeSuffix.length + (sanitizedBase ? 1 : 0) : 0;
  const clampedBase = clampBaseLength(sanitizedBase, maxLength, reservedLength);
  const candidate = composeId(clampedBase, codeSuffix || void 0);
  return candidate;
};
const isValidEntityId = (value, allowCodeSuffix = false) => {
  if (!value) return false;
  return allowCodeSuffix ? CODE_ALLOWED_PATTERN.test(value) : BASIC_ALLOWED_PATTERN.test(value);
};
const collectBaseSegments = (entity, options) => {
  const segments = /* @__PURE__ */ new Set();
  if (!entity) return [];
  options?.prefer?.forEach((candidate) => pushSegment(segments, candidate));
  if (entity.type === "person") {
    const biography = entity.properties?.biography ?? {};
    const nameParts = [
      toStringOrNull(biography?.firstName),
      toStringOrNull(biography?.middleName),
      toStringOrNull(biography?.lastName)
    ].filter(Boolean);
    if (nameParts.length > 0) {
      pushSegment(segments, nameParts.join("-"));
    }
    pushSegment(segments, biography?.nickName);
    const jobs = entity.properties?.jobs;
    if (jobs) pushSegment(segments, Array.isArray(jobs) ? jobs[0] : jobs);
  }
  if (entity.type === "bonus") {
    const usableFor = entity.properties?.usableFor;
    const usableIn = entity.properties?.usableIn;
    if (usableFor) pushSegment(segments, Array.isArray(usableFor) ? usableFor[0] : usableFor);
    if (usableIn) pushSegment(segments, Array.isArray(usableIn) ? usableIn[0] : usableIn);
  }
  pushSegment(segments, entity.name);
  pushSegment(segments, entity.title);
  pushSegment(segments, entity.kind);
  pushSegment(segments, entity.type);
  if (segments.size === 0) {
    pushSegment(segments, options?.fallback ?? entity.type ?? "entity");
  }
  pushSegment(segments, entity.properties?.begin_time ? parseDateCorrectly$1?.(entity.properties?.begin_time)?.toLocaleString?.("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })?.trim()?.toLowerCase?.()?.replace?.(/\s+/g, "_")?.replace?.(/[\,\-\_\:\.\\\/]/g, "-")?.replace?.(/[\"\'\(\)\[\]]/g, "")?.replace?.(/\-\-/g, "_") : null);
  return Array.from(segments).filter((segment) => segment.length > 0);
};
const generateEntityId = (entity, options = {}) => {
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
  const allowCodeSuffix = isCodeSuffixAllowed(entity);
  const codeSuffix = allowCodeSuffix ? sanitizeCodeSuffix(entity.properties?.code) : "";
  const segments = collectBaseSegments(entity, options);
  const base = segments.join("_");
  const reservedLength = codeSuffix ? codeSuffix.length + (base ? 1 : 0) : 0;
  const clampedBase = clampBaseLength(base, maxLength, reservedLength);
  const existingSet = prepareExistingSet(options.existingIds);
  const candidate = ensureUniqueId(clampedBase, codeSuffix, existingSet, maxLength);
  if (options.mutateExistingIds && existingSet) {
    existingSet.add(candidate);
  }
  return candidate;
};
const fixEntityId = (entity, options = { mutate: true, rebuild: true }) => {
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
  const allowCodeSuffix = isCodeSuffixAllowed(entity);
  const existingSet = prepareExistingSet(options.existingIds);
  const forceRebuild = options.rebuild === true;
  let currentId = toStringOrNull(entity?.id) ?? "";
  let sanitizedId = sanitizeExistingIdValue(currentId, allowCodeSuffix, maxLength);
  if (forceRebuild || !sanitizedId || !isValidEntityId(sanitizedId, allowCodeSuffix)) {
    sanitizedId = generateEntityId(entity, { ...options, existingIds: existingSet });
  }
  if (existingSet && existingSet.has(sanitizedId)) {
    const baseWithoutNumeric = sanitizedId.replace(/(?:-[0-9]+)?$/, "");
    const baseWithoutCode = allowCodeSuffix ? baseWithoutNumeric.replace(/_CODE[0-9A-Z]*$/i, "") : baseWithoutNumeric;
    sanitizedId = ensureUniqueId(
      baseWithoutCode,
      allowCodeSuffix ? sanitizeCodeSuffix(entity.properties?.code) : "",
      existingSet,
      maxLength
    );
  }
  if (options.mutateExistingIds && existingSet) existingSet.add(sanitizedId);
  if (options.mutate !== false && entity) entity.id = sanitizedId;
  return sanitizedId;
};

"use strict";
async function opfsModifyJson(options) {
  const {
    dirPath,
    transform,
    filter,
    indent = 2,
    dryRun = false,
    prettyStable = true
  } = options;
  assertOpfs();
  const root = await navigator.storage.getDirectory()?.catch?.(console.warn.bind(console));
  const normDirPath = normalizePath(dirPath);
  const dir = await getDirByPath(root, normDirPath);
  let processed = 0;
  let changed = 0;
  let errors = 0;
  for await (const { handle, name, fullPath } of walk(dir, normDirPath)) {
    if (handle.kind !== "file" || !name.toLowerCase().endsWith(".json")) continue;
    if (filter && !filter(name, fullPath)) continue;
    try {
      const file = await handle.getFile();
      const originalText = await file.text();
      let data;
      try {
        data = originalText.trim() === "" ? null : JSOX.parse(originalText);
      } catch (_) {
        try {
          data = originalText.trim() === "" ? null : JSON.parse(originalText);
        } catch (e) {
          console.warn(`JSON parse error: ${fullPath}`, e);
          errors++;
          continue;
        }
      }
      const result = await transform(data, { path: normDirPath, name, fullPath });
      if (typeof result === "undefined") {
        processed++;
        continue;
      }
      const newText = serializeJSON(result, { indent, prettyStable });
      if (normalizeEol(newText) === normalizeEol(originalText)) {
        processed++;
        continue;
      }
      if (dryRun) {
        console.log(`[dry-run] Would update: ${fullPath}`);
      } else {
        const writable = await handle.createWritable();
        await writable.truncate(0);
        await writable.write(newText);
        await writable.close();
        console.log(`Updated: ${fullPath}`);
      }
      processed++;
      changed++;
    } catch (e) {
      console.error(`Failed on ${fullPath}:`, e);
      errors++;
    }
  }
  return { processed, changed, errors };
}
function normalizePath(p) {
  if (!p || p === "/" || p === ".") return "";
  return p.split("/").filter(Boolean).join("/");
}
function assertOpfs() {
  if (!("storage" in navigator) || typeof navigator.storage.getDirectory !== "function") {
    throw new Error("OPFS is not available in this browser/context. Need navigator.storage.getDirectory().");
  }
}
async function getDirByPath(rootDirHandle, path) {
  if (!path || path === "/" || path === ".") return rootDirHandle;
  const parts = path.split("/").map((s) => s.trim()).filter(Boolean);
  let dir = rootDirHandle;
  for (const part of parts) {
    dir = await dir?.getDirectoryHandle?.(part, { create: false });
  }
  return dir;
}
async function* walk(dirHandle, basePath = "") {
  for await (const [name, handle] of dirHandle.entries()) {
    const fullPath = basePath ? `${basePath}/${name}` : name;
    if (handle.kind === "directory") {
      yield* walk(handle, fullPath);
    } else {
      yield { handle, name, fullPath };
    }
  }
}
function serializeJSON(obj, { indent = 2, prettyStable = true } = {}) {
  const replacer = prettyStable ? stableReplacer : void 0;
  return JSON.stringify(obj, replacer, indent) + "\n";
}
function stableReplacer(key, value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out = {};
    for (const k of Object.keys(value).sort()) {
      out[k] = value[k];
    }
    return out;
  }
  return value;
}
function normalizeEol(s) {
  return s.replace(/\r\n/g, "\n");
}

"use strict";
const writeFilesToDir = async (dir, files) => {
  const items = Array.from(files);
  for (const file of items) {
    dir = dir?.trim?.();
    dir = dir?.endsWith?.("/") ? dir : dir + "/";
    await writeFileSmart(null, dir, file);
  }
  return items.length;
};
const getMarkDownFromFile = async (handle) => {
  const markdown = await handle?.getFile?.();
  return await markdown?.text?.() || "";
};
const getJSONFromFile = async (handle) => {
  if (Array.isArray(handle)) handle = handle?.[0];
  if (!handle) return null;
  const json = await handle?.getFile?.();
  return parseJsonSafely(await json?.text?.() || "{}");
};
const hasCriteriaInText = async (text, criteria) => {
  return criteria?.some?.(async (criterion) => text?.includes?.(criterion));
};
const readJSONs = async (dir) => {
  const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
  const factors = await Array.fromAsync(dirHandle?.entries?.() ?? []);
  return Promise.all(factors?.map?.((factor) => getJSONFromFile(factor)));
};
const readJSONsFiltered = async (dir, filterFiles) => {
  const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
  const factors = await Array.fromAsync(dirHandle?.entries?.() ?? []);
  return Promise.all(factors?.map?.((factor) => getJSONFromFile(factor)));
};
const readMarkDownsFiltered = async (dir, filterFiles) => {
  const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
  const preferences = await Array.fromAsync(dirHandle?.entries?.() ?? []);
  return Promise.all(preferences?.map?.(async (preferences2) => await getMarkDownFromFile(preferences2))?.filter?.(async (fileData) => !filterFiles || await hasCriteriaInText(await fileData, filterFiles)));
};
const readMarkDowns = async (dir) => {
  const dirHandle = typeof dir === "string" ? await getDirectoryHandle(null, dir) : dir;
  const preferences = await Array.fromAsync(dirHandle?.entries?.() ?? []);
  return Promise.all(preferences?.map?.((preference) => getMarkDownFromFile(preference?.[1])));
};
const readOneMarkDown = async (path) => {
  const markdown = await getFileHandle(null, path);
  if (!markdown) return "";
  if (markdown?.type?.startsWith?.("image/")) return "";
  return await markdown?.text?.();
};
const suitableDirsByEntityTypes = (entityTypes) => {
  return entityTypes?.map?.((entityType) => {
    return entityType == "timeline" || entityType == "task" ? "/timeline/" : `/data/${entityType}/`;
  });
};
const writeJSON = async (data, dir = null) => {
  if (!data) return;
  const writeOne = async (obj, index = 0) => {
    if (!obj) return;
    obj = parseJsonSafely(obj);
    if (!obj) return;
    const entityType = obj?.type ?? detectEntityTypeByJSON(obj) ?? "unknown";
    if (!dir) dir = suitableDirsByEntityTypes([entityType])?.[0];
    dir = dir?.trim?.();
    let fileName = (fixEntityId(obj) || obj?.name || `${Date.now()}`)?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, "-")?.replace?.(/[^a-z0-9_\-+#&]/g, "-");
    fileName = fileName?.trim?.();
    fileName = fileName?.endsWith?.(".json") ? fileName : fileName + ".json";
    return writeFileSmart(null, `${dir}${fileName}`, new File([JSOX.stringify(obj)], fileName, { type: "application/json" }))?.catch?.(console.warn.bind(console));
  };
  let results = await (Array.isArray(data) ? Promise.all(data.map((item, index) => writeOne(item, index))) : writeOne(data, 0))?.catch?.(console.warn.bind(console));
  if (typeof document !== "undefined")
    document?.dispatchEvent?.(new CustomEvent("rs-fs-changed", { detail: results, bubbles: true, composed: true, cancelable: true }));
  return results;
};
const writeMarkDown = async (data, path = null) => {
  if (!data) return;
  path = path?.trim?.();
  let filename = (`${Date.now()}`?.toString?.()?.toLowerCase?.()?.replace?.(/\s+/g, "-")?.replace?.(/[^a-z0-9_\-+#&]/g, "-")?.trim?.() || `${Date.now()}`) + ".md";
  if (!path) {
    path = "/docs/preferences/";
  } else {
    filename = path?.split?.("/")?.pop?.() || filename;
  }
  filename = filename?.endsWith?.(".md") ? filename : filename + ".md";
  let results = await writeFileSmart(null, path, data instanceof File ? data : new File([data], filename, { type: "text/markdown" }))?.catch?.(console.warn.bind(console));
  if (typeof document !== "undefined")
    document?.dispatchEvent?.(new CustomEvent("rs-fs-changed", { detail: results, bubbles: true, composed: true, cancelable: true }));
  return results;
};
const handleDataByType = async (item, handler) => {
  if (typeof item === "string") {
    if (item?.startsWith?.("data:image/") && item?.includes?.(";base64,")) {
      const parts = parseDataUrl(item);
      const mimeType = parts?.mimeType || "image/png";
      const file = await stringToFile(item, "clipboard-image", { mimeType, uriComponent: true });
      return handler({ url: item, file });
    } else if (canParseURL(item)) {
      return handler({ url: item });
    }
  } else if (item instanceof File || item instanceof Blob) {
    return handler({ file: item });
  }
};
const handleDataTransferFiles = async (files, handler) => {
  for (const file of files) {
    handleDataByType(file, handler);
  }
};
const handleDataTransferItemList = async (items, handler) => {
  for (const item of items) {
    handleDataByType(item, handler);
  }
};
const handleClipboardItems = async (items, handler) => {
  for (const item of items) {
    for (const type of item?.types ?? []) {
      if (type.startsWith("text/")) {
        const text = await (await item?.getType?.(type))?.text?.();
        return handleDataByType(text, handler);
      }
      if (type.startsWith("image/")) {
        const blob = await item?.getType?.(type);
        return handleDataByType(blob, handler);
      }
    }
  }
};
const handleDataTransferInputEvent = (dataTransfer, handler) => {
  const items = dataTransfer?.items;
  const files = dataTransfer?.files ?? [];
  if (items) {
    handleDataTransferItemList(items, handler);
  }
  if (files && files?.length > 0) {
    handleDataTransferFiles(files, handler);
  }
};
const parseJsonSafely = (text) => {
  if (!text) return null;
  if (typeof text != "string") {
    return text;
  }
  ;
  try {
    return JSOX.parse(text);
  } catch (_) {
    try {
      return JSON.parse(text);
    } catch (_2) {
      console.warn("Failed to parse JSON", text);
      return text;
    }
  }
};
const postCommitAnalyze = async (payload, API_ENDPOINT = "/commit-analyze") => {
  const fd = new FormData();
  if (payload.text) fd.append("text", payload.text);
  if (payload.url) fd.append("url", payload.url);
  if (payload.file) fd.append("files", payload.file, payload.file?.name || "pasted");
  const resp = await fetch(API_ENDPOINT, { method: "POST", priority: "auto", keepalive: true, body: fd })?.catch?.(console.warn.bind(console));
  if (!resp) return [];
  const json = parseJsonSafely(await resp?.text?.()?.catch?.(console.warn.bind(console)) || "{}");
  if (!json) return [];
  return json?.results?.map?.((res) => res?.data)?.filter?.((data) => !!data?.trim?.());
};
const postCommitRecognize = (targetDir = "/docs/preferences/") => {
  return async (payload, API_ENDPOINT = "/commit-recognize") => {
    const fd = new FormData();
    if (payload.text) fd.append("text", payload.text);
    if (payload.url) fd.append("url", payload.url);
    if (payload.file) fd.append("files", payload.file, payload.file?.name || "pasted");
    fd.append("targetDir", targetDir);
    const resp = await fetch(API_ENDPOINT, { method: "POST", priority: "auto", keepalive: true, body: fd })?.catch?.(console.warn.bind(console));
    if (!resp) return [];
    const json = parseJsonSafely(await resp?.text?.()?.catch?.(console.warn.bind(console)) || "{}");
    if (!json) return [];
    return json?.results?.filter?.((data) => !!data?.data?.trim?.())?.map?.((res) => res?.data);
  };
};
const normalizePayload = async (payload) => {
  if (payload.file instanceof File || payload.file instanceof Blob) {
    if (payload.file instanceof File && payload.file.size > MAX_BASE64_SIZE && payload.file.type.startsWith("image/")) {
      return { ...payload, file: await convertImageToJPEG(payload.file) };
    }
    return payload;
  }
  const text = payload.text || payload.url;
  if (typeof text === "string") {
    const match = text.match(BASE64_PREFIX);
    if (match && match.groups) {
      const { mime, data } = match.groups;
      const byteLen = Math.ceil(data.length * 3 / 4);
      if (byteLen > MAX_BASE64_SIZE) {
        const bytes = decodeBase64ToBytes(data, { alphabet: "base64", lastChunkHandling: "loose" });
        const blob = new Blob([bytes], { type: mime });
        const converted = await convertImageToJPEG(blob);
        return { file: converted };
      }
    }
  }
  return payload;
};
const writeTextDependsByPossibleType = async (payload, entityType) => {
  if (!payload) return;
  if (canParseURL(payload || "")) payload = await fetch(payload).then((res) => res.text())?.catch?.(console.warn.bind(console)) || "";
  if (!payload) return;
  let json = {};
  json = parseJsonSafely(payload || "{}");
  if (!json) return;
  try {
    if (!entityType) entityType = detectEntityTypeByJSON(json);
    return writeJSON(json, entityType == "task" || entityType == "timeline" ? "/timeline/" : `data/${entityType}/`);
  } catch (e) {
    return writeMarkDown(payload, `docs/${entityType}/`);
  }
};
const sendToEntityPipeline = async (payload, options = {}) => {
  const entityType = options.entityType || DEFAULT_ENTITY_TYPE;
  const normalized = await normalizePayload(payload);
  const next = options.beforeSend ? await options.beforeSend(normalized) : normalized;
  if (!next.file && (next.text || next.url)) return writeTextDependsByPossibleType(next.text || next.url, entityType);
  return handleDataTransferFiles(next.file ? [next.file] : [], postCommitAnalyze);
};
const loadTimelineSources = async (dir = "/docs/preferences") => {
  try {
    const root = await getDirectoryHandle(null, dir)?.catch(() => null);
    if (!root) return [];
    const entries = await Array.fromAsync(root.entries?.() ?? []);
    return entries.map((entry) => entry?.[0]).filter((name) => typeof name === "string" && name.trim().length).map((name) => name.replace(/\.md$/i, ""));
  } catch (e) {
    console.warn(e);
    return [];
  }
};
const extractRecognizedData = (unknownData) => {
  try {
    unknownData = typeof unknownData == "string" ? JSON.parse(unknownData?.trim?.() || "[]") : unknownData;
  } catch (e) {
  }
  if (unknownData?.recognized_data) {
    return extractRecognizedData(unknownData?.recognized_data);
  }
  ;
  if (typeof unknownData == "string" && unknownData?.trim?.()) {
    return unknownData?.trim?.();
  } else if (Array.isArray(unknownData) && unknownData?.length) {
    return unknownData?.map?.((item) => extractRecognizedData(item))?.filter?.((item) => item && typeof item === "string")?.join?.("\n") || "";
  }
  return "";
};
const controlChannel = new BroadcastChannel("rs-sw");
controlChannel.addEventListener("message", (event) => {
  const payload = event?.data;
  if (!payload || payload?.type !== "commit-result" && payload?.type !== "commit-to-clipboard") return;
  if (payload?.type === "commit-result") {
    flushQueueIntoOPFS?.()?.then?.(() => {
      showSuccess("Data has been saved to the filesystem.");
    })?.catch?.((e) => {
      console.warn("Failed to save data to filesystem.", e, payload);
      showError("Failed to save data to filesystem.");
    });
  } else if (payload?.type === "commit-to-clipboard") {
    const data = payload?.results?.map?.((result) => extractRecognizedData(result?.data?.recognized_data || result?.data))?.filter?.((result) => result && typeof result === "string")?.join?.("\n") || "";
    if (data?.trim?.()) {
      navigator?.clipboard?.writeText?.(data)?.then?.(() => {
        showSuccess("Data has been copied to clipboard.");
      })?.catch?.((e) => {
        console.warn("Failed to copy data to clipboard.", e, data);
        showError("Failed to copy data to clipboard. Data is not copied.");
      });
    } else {
      showError("Failed to copy data to clipboard. Data is empty.");
    }
  }
});
if (typeof navigator !== "undefined" && "storage" in navigator && typeof navigator.storage.getDirectory === "function") {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback?.(() => {
      flushQueueIntoOPFS();
    });
  } else {
    setTimeout(() => {
      flushQueueIntoOPFS();
    }, 1e3);
  }
}
async function flushQueueIntoOPFS() {
  const results = await dumpAndClear();
  return Promise.all(results.map((result) => {
    const { data, name, dataType, directory } = result;
    if (dataType === "json") {
      let jsonData = parseJsonSafely(data);
      if (!jsonData) return;
      return writeJSON(jsonData, directory?.trim?.());
    } else {
      return writeMarkDown(data, directory?.trim?.() + name?.trim?.());
    }
  }));
}
try {
  opfsModifyJson({
    dirPath: "/data/",
    transform: (data) => {
      if (data && typeof data === "object") {
        fixEntityId(data, { mutate: true });
      }
      ;
      return data;
    }
  })?.catch?.(console.warn.bind(console));
} catch (e) {
  console.warn(e);
}
try {
  opfsModifyJson({
    dirPath: "/timeline/",
    transform: (data) => {
      if (data && typeof data === "object") {
        fixEntityId(data, { mutate: true });
      }
      ;
      return data;
    }
  })?.catch?.(console.warn.bind(console));
} catch (e) {
  console.warn(e);
}
const writeTimelineTask = async (task) => {
  const name = task?.id || task?.name || task?.desc?.name || `${Date.now()}`;
  let fileName = name || "timeline.json";
  fileName = fileName?.endsWith?.(".json") ? fileName : fileName + ".json";
  const filePath = `${TIMELINE_DIR}${fileName}`;
  const file = new File([JSOX.stringify(task)], fileName, { type: "application/json" });
  return writeFileSmart(null, filePath, file)?.catch?.(console.error.bind(console));
};
const writeTimelineTasks = async (tasks) => {
  return Promise.all(tasks?.map?.(async (task) => writeTimelineTask(task)) || []);
};
const loadAllTimelines = async (DIR = TIMELINE_DIR) => {
  const dirHandle = await getDirectoryHandle(null, DIR)?.catch?.(console.warn.bind(console));
  const timelines = await Array.fromAsync(dirHandle?.entries?.() ?? []);
  return (await Promise.all(timelines?.map?.(async ([name, fileHandle]) => {
    if (name?.endsWith?.(".crswap")) return;
    if (!name?.trim?.()?.endsWith?.(".json")) return;
    const file = await fileHandle.getFile();
    let item = null;
    item = parseJsonSafely(await file?.text?.() || "{}");
    if (!item) return;
    item.__name = name;
    item.__path = `${DIR}${name}`;
    return item;
  })))?.filter?.((e) => e);
};

"use strict";
const STORE = "cache";
const idbOpen = async () => {
  return new Promise((res, rej) => {
    const req = indexedDB.open(STORE, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "key" });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
};
const idbGet = async (key) => {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      res(req.result?.value);
      db.close();
    };
    req.onerror = () => {
      rej(req.error);
      db.close();
    };
  });
};
const idbPut = async (key, value) => {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ key, value });
    tx.oncomplete = () => {
      res(void 0);
      db.close();
    };
    tx.onerror = () => {
      rej(tx.error);
      db.close();
    };
  });
};
const realtimeStates = observe({
  time: /* @__PURE__ */ new Date(),
  timestamp: Date.now(),
  coords: {},
  otherProps: /* @__PURE__ */ new Map([]),
  // for payments, id is card id, value is card balance (if available), or additional info
  cards: /* @__PURE__ */ new Map([])
});
const editableArray = (category, items) => {
  const wrapped = observe(items);
  let timeout;
  iterated(wrapped, (item, index) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      idbPut(category?.id, JSOX.stringify(safe(wrapped)))?.catch?.(console.warn.bind(console));
    }, 100);
  });
  return wrapped;
};
const observeCategory = (category) => {
  Object.defineProperty(category, "items", {
    get: () => {
      return Promised((async () => editableArray(category, JSOX.parse(await idbGet(category?.id) ?? "[]")))());
    },
    set: (value) => {
      idbPut(category?.id, JSOX.stringify(safe(value)))?.catch?.(console.warn.bind(console));
    }
  });
  return category;
};
const $wrapCategory = (category) => {
  return observe(observeCategory(category));
};
const tasksCategories = observe([
  $wrapCategory({
    label: "Tasks",
    id: "task"
  })
]);
const dataCategories = observe([
  $wrapCategory({
    label: "Items",
    id: "item"
  }),
  $wrapCategory({
    label: "Bonuses",
    id: "bonus"
  }),
  $wrapCategory({
    label: "Services",
    id: "service"
  }),
  $wrapCategory({
    label: "Locations",
    id: "location"
  }),
  $wrapCategory({
    label: "Events",
    id: "events"
  }),
  $wrapCategory({
    label: "Factors",
    id: "factor"
  }),
  $wrapCategory({
    label: "Entertainments",
    id: "entertainment"
  }),
  $wrapCategory({
    label: "Markets",
    id: "market"
  }),
  $wrapCategory({
    label: "Places",
    id: "place"
  }),
  $wrapCategory({
    label: "Vendors",
    id: "vendor"
  }),
  $wrapCategory({
    label: "Persons",
    id: "person"
  }),
  $wrapCategory({
    label: "Skills",
    id: "skill"
  }),
  /*$wrapCategory({
      label: "Entertainments",
      id: "entertainment"
  }),*/
  $wrapCategory({
    label: "Vehicles",
    id: "vehicle"
  }),
  $wrapCategory({
    label: "Rewards",
    id: "reward"
  }),
  $wrapCategory({
    label: "Fines",
    id: "fine"
  }),
  $wrapCategory({
    label: "Actions",
    id: "action"
  }),
  $wrapCategory({
    label: "Lotteries",
    id: "lottery"
  })
]);
const broadcastChannel = new BroadcastChannel("geolocation");
broadcastChannel.addEventListener("message", (e) => {
  if (e.data.coords) {
    realtimeStates.coords = (typeof e.data.coords == "string" ? JSOX.parse(e.data.coords) : e.data.coords) || {};
    realtimeStates.timestamp = Date.now();
    realtimeStates.time = /* @__PURE__ */ new Date();
  }
});
setInterval(() => {
  realtimeStates.time = /* @__PURE__ */ new Date();
}, 1e3);

const AI_OUTPUT_SCHEMA = "# Entities Spec V2\n\nFor understanding and for AI generation.\n\n## Output Format\n\n`{ \"entities\": ENTITY[], \"keywords\"?: STRING[], \"short_description\"?: MARKDOWN }`\n\n---\n\n## Entity Structure\n\n```\nENTITY={\n    \"type\": ENUM:TYPE,\n    \"id\": UNIQUE[ID],\n    \"kind\": ENUM:KIND[OF:TYPE],\n    \"name\"?: STRING,\n    \"title\"?: STRING,\n    \"icon\"?: PHOSPHOR_ICON_ID,\n    \"properties\": PROPERTIES[OF:TYPE]|{},\n    \"description\": MARKDOWN,\n    \"image\": URL,\n    \"variant\": ENUM:COLOR\n}\n```\n\n---\n\n## Data Types\n\n- `MARKDOWN=STRING|STRING[]`\n- `URL=STRING|{\"url\": STRING, \"type\": ENUM:URL_TYPE}`\n- `DATE={\"timestamp\"?: NUMBER, \"iso_date\"?: STRING}`\n- `CONTACT={\"email\"?: STRING[], \"phone\"?: STRING[], \"links\"?: STRING[]}`\n- `LOCATION=STRING|{ \"coordinate\"?: COORDINATE, \"address\"?: ADDRESS }`\n- `COORDINATE={ \"latitude\": NUMBER, \"longitude\": NUMBER }`\n- `ADDRESS={ \"street\"?: STRING, \"house\"?: STRING, \"flat\"?: STRING, \"floor\"?: NUMBER, \"room\"?: NUMBER, \"square\"?: NUMBER, \"price\"?: NUMBER }`\n- `ID=KEY[STRING|NUMBER]`\n- `BIOGRAPHY={ \"firstName\"?: STRING, \"lastName\"?: STRING, \"middleName\"?: STRING, \"nickName\"?: STRING, \"birthdate\"?: DATE, \"gender\"?: ENUM:GENDER }`\n\n---\n\n## Enums\n\n- `TYPE=\"task\"|\"event\"|\"action\"|\"service\"|\"item\"|\"skill\"|\"vendor\"|\"place\"|\"factor\"|\"person\"|\"bonus\"`\n- `COLOR=\"red\"|\"green\"|\"blue\"|\"yellow\"|\"orange\"|\"purple\"|\"brown\"|\"gray\"|\"black\"|\"white\"`\n- `TASK_STATUS=\"under_consideration\"|\"pending\"|\"in_progress\"|\"completed\"|\"failed\"|\"delayed\"|\"canceled\"|\"other\"`\n- `AFFECT=\"positive\"|\"negative\"|\"neutral\"`\n- `GENDER=\"male\"|\"female\"|\"other\"`\n- `URL_TYPE=\"website\"|\"email\"|\"phone\"|\"social\"|\"other\"`\n\n### Kinds\n\n```\nKIND=MAPPED_BY[TYPE][\n    [\"task\", ENUM=\"job\"|\"action\"|\"other\"],\n    [\"event\", ENUM=\"education\"|\"lecture\"|\"conference\"|\"meeting\"|\"seminar\"|\"workshop\"|\"presentation\"|\"celebration\"|\"opening\"|\"other\"],\n    [\"action\", ENUM=\"thinking\"|\"imagination\"|\"remembering\"|\"speaking\"|\"learning\"|\"listening\"|\"reading\"|\"writing\"|\"moving\"|\"traveling\"|\"speech\"|\"physically\"|\"crafting\"|\"following\"|\"other\"],\n    [\"service\", ENUM=\"product\"|\"consultation\"|\"advice\"|\"medical\"|\"mentoring\"|\"training\"|\"item\"|\"thing\"|\"other\"],\n    [\"item\", ENUM=\"currency\"|\"book\"|\"electronics\"|\"furniture\"|\"medicine\"|\"tools\"|\"software\"|\"consumables\"|\"other\"],\n    [\"skill\", ENUM=\"skill\"|\"knowledge\"|\"ability\"|\"trait\"|\"experience\"|\"other\"],\n    [\"vendor\", ENUM=\"vendor\"|\"company\"|\"organization\"|\"institution\"|\"other\"],\n    [\"place\", ENUM=\"placement\"|\"place\"|\"school\"|\"university\"|\"service\"|\"clinic\"|\"pharmacy\"|\"hospital\"|\"library\"|\"market\"|\"location\"|\"shop\"|\"restaurant\"|\"cafe\"|\"bar\"|\"hotel\"|\"other\"],\n    [\"factor\", ENUM=\"weather\"|\"health\"|\"family\"|\"relationships\"|\"job\"|\"traffic\"|\"business\"|\"economy\"|\"politics\"|\"news\"|\"other\"],\n    [\"person\", ENUM=\"specialist\"|\"consultant\"|\"coach\"|\"mentor\"|\"dear\"|\"helper\"|\"assistant\"|\"friend\"|\"family\"|\"relative\"|\"other\"]\n]\n```\n\n---\n\n## Data Maps\n\n```\nPROPERTIES=MAPPED_BY[TYPE][\n    [\"task\", TASK_STRUCTURE],\n    [\"event\", EVENT_STRUCTURE],\n    [\"action\", ACTION_STRUCTURE],\n    [\"service\", SERVICE_STRUCTURE],\n    [\"item\", ITEM_STRUCTURE],\n    [\"skill\", SKILL_STRUCTURE],\n    [\"vendor\", VENDOR_STRUCTURE],\n    [\"place\", PLACE_STRUCTURE],\n    [\"factor\", FACTOR_STRUCTURE],\n    [\"person\", PERSON_STRUCTURE]\n]\n```\n\n---\n\n## Properties Structures\n\n### Task\n\nImportant: Task can't be recognized directly from data source, but can be created by preference or user/prompt desire.\n\n```\nTASK_STRUCTURE={\n    \"status\": ENUM:TASK_STATUS,\n    \"begin_time\": DATE,\n    \"end_time\": DATE,\n    \"location\"?: LOCATION,\n    \"contacts\"?: CONTACT,\n    \"members\"?: ID[],\n    \"events\"?: ID[],\n}\n```\n\n### Event\n\n```\nEVENT_STRUCTURE={\n    \"begin_time\": DATE,\n    \"end_time\": DATE,\n    \"location\": LOCATION,\n    \"contacts\": CONTACT\n}\n```\n\n### Person\n\n```\nPERSON_STRUCTURE={\n    \"home\": LOCATION,\n    \"jobs\": LOCATION[],\n    \"biography\": BIOGRAPHY,\n    \"tasks\": ID[],\n    \"contacts\": CONTACT,\n    \"services\": ID[],\n    \"prices\": MAP<STRING,NUMBER>\n}\n```\n\n### Service\n\n```\nSERVICE_STRUCTURE={\n    \"location\": LOCATION,\n    \"persons\": ID[],\n    \"specialization\": STRING[],\n    \"contacts\": CONTACT,\n    \"prices\": MAP<STRING,NUMBER>\n}\n```\n\n### Factor\n\n```\nFACTOR_STRUCTURE={\n    \"affect\": ENUM:AFFECT,\n    \"actions\": ID[],\n    \"location\": LOCATION,\n}\n```\n\n### Bonus\n\n```\nBONUS_STRUCTURE={\n    \"code\"?: STRING,\n    \"usableFor\"?: ID[],\n    \"usableIn\"?: ID[],\n    \"availability\"?: {\n        \"count: NUMBER,\n        \"time\": STRING[],\n        \"days\": STRING[]\n    },\n    \"requirements\"?: ANY[],\n    \"additionalProperties\"?: MAP<STRING,UNKNOWN>,\n    \"profits\"?: MAP<STRING,NUMBER>\n}\n```\n\n### OTHER\n\nTODO: Planned to explain later.\n\n---\n\n## Other types\n\nTODO: Planned to explain later.\n\n---\n\n## Appendix: Name Generation\n\n```\n\"Give potential IDs for entities in following rules:\",\n\nRules for generating entity IDs ('id' fields, ID type):\n- Letters or numbers (only in lowercase)\n- Allowed symbols, such as '-', '_', '&', '#', '+'\n- Whitespace not allowed\n- No emojis or special symbols\n- No Cyrillic or Latin letters\n- Only promo-codes or codes may has uppercase letters\n\nHow generates entity IDs:\n- If known person names (biography), use formatted their names, location or job also can be used.\n- Prefixed by service, market or vendor (if bonus entity, such as promo, discount, bonus, etc.)\n- Name, type or kind (if no name declared) of entity encodes into ID by conversion spaces into '-', etc.\n- CODE suffix is used for unique code of entity, such as promo-code, discount-code, etc.\n\nFor example:\n\n/*\n   - [in bonuses list] zdravia-clinic_therapist_CODE123 - promo-code for therapist of zdravia-clinic\n   - [in persons list] alena-victorovna_additional-identifier - person of Alena Viktorovna, for additional identifier may be used service, skill, email or phone number\n   - [in items list] book_the-best-book - book of the best book\n*/\n\nSuch idea used for make simpler search, filtering and sorting of entities.\n```\n";

"use strict";
const getTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
function isPureHHMM(str) {
  if (!str) return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(str).trim());
}
function parseDateCorrectly(str) {
  if (!str) return /* @__PURE__ */ new Date();
  if (str instanceof Date) return new Date(str);
  if (typeof str == "object" && str?.timestamp) return parseDateCorrectly(str.timestamp);
  if (typeof str == "object" && str?.iso_date) return parseDateCorrectly(str.iso_date);
  if (typeof str == "object" && str?.date) return parseDateCorrectly(str.date);
  if (typeof str == "number") {
    if (str >= 1e12) return new Date(str);
    const multiplier = Math.pow(10, 11 - (String(str | 0)?.length || 11)) | 0;
    return new Date(str * multiplier);
  }
  if (typeof str == "string" && isPureHHMM(str)) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(str.trim());
    if (!m) return /* @__PURE__ */ new Date();
    const [, hh, mm] = m;
    const now = /* @__PURE__ */ new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hh), Number(mm), 0, 0);
  }
  return new Date(String(str));
}
function parseAndGetCorrectTime(str) {
  if (!str) return Date.now();
  if (typeof str == "number") {
    if (str >= 1e12) return str;
    const multiplier = Math.pow(10, 11 - (String(str | 0)?.length || 11)) | 0;
    return str * multiplier;
  }
  if (str instanceof Date) return str.getTime();
  return parseDateCorrectly(str)?.getTime?.() ?? Date.now();
}
const getComparableTimeValue = (value) => {
  if (value == null) return Number.NaN;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const date = parseDateCorrectly(value);
  if (date && !Number.isNaN(date?.getTime())) return date?.getTime() ?? 0;
  const match = String(value).match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?/);
  if (match) {
    const hours = Number(match[1]) || 0;
    const minutes = Number(match[2]) || 0;
    const seconds = Number(match[3]) || 0;
    return ((hours * 60 + minutes) * 60 + seconds) * 1e3;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
};
const isDate = (date) => {
  const firstStep = date instanceof Date || typeof date == "string" && date.match(/^\d{4}-\d{2}-\d{2}$/);
  let secondStep = false;
  try {
    secondStep = getComparableTimeValue(date) > 0;
  } catch {
    secondStep = false;
  }
  return firstStep && secondStep;
};
const checkInTimeRange = (beginTime, endTime, currentTime) => {
  if (beginTime && endTime) {
    return getComparableTimeValue(beginTime) < getComparableTimeValue(currentTime) && getComparableTimeValue(currentTime) < getComparableTimeValue(endTime);
  }
  if (beginTime) return getComparableTimeValue(beginTime) < getComparableTimeValue(currentTime);
  if (endTime) return getComparableTimeValue(currentTime) < getComparableTimeValue(endTime);
  return false;
};
const checkRemainsTime = (beginTime, endTime, currentTime, maxDays = 7) => {
  let factorMasked = true;
  if (beginTime) factorMasked &&= getComparableTimeValue(currentTime) <= getComparableTimeValue(beginTime);
  if (endTime) factorMasked &&= getComparableTimeValue(currentTime) < getComparableTimeValue(endTime);
  if (maxDays) {
    const dateLimit = getComparableTimeValue(currentTime) + maxDays * 24 * 60 * 60 * 1e3;
    factorMasked &&= getComparableTimeValue(beginTime) < getComparableTimeValue(dateLimit);
  }
  return factorMasked;
};
const getISOWeekNumber = (input) => {
  if (!input) return null;
  const target = new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
};
const createDayDescriptor = (input, partial = {}) => {
  if (!input) return null;
  const timeZone = getTimeZone();
  const dayBegin = new Date(input.getTime());
  dayBegin.setHours(0, 0, 0, 0);
  const dayEnd = new Date(input.getTime());
  dayEnd.setHours(23, 59, 59, 999);
  const dayDay = dayBegin.toLocaleDateString("en-GB", { day: "numeric", timeZone });
  const dayWeekday = dayBegin.toLocaleDateString("en-GB", { weekday: "short", timeZone });
  const dayMonth = dayBegin.toLocaleDateString("en-GB", { month: "short", timeZone });
  const dayTitle = `${dayDay} ${dayMonth} ${dayWeekday}`;
  const dayDayForId = dayBegin.toLocaleDateString("en-GB", { day: "numeric", timeZone });
  const dayMonthForId = dayBegin.toLocaleDateString("en-GB", { month: "numeric", timeZone });
  const dayYearForId = dayBegin.toLocaleDateString("en-GB", { year: "numeric", timeZone });
  const dayId = `${dayDayForId}_${dayMonthForId}_${dayYearForId}`;
  const fullDay = dayBegin.toLocaleDateString("en-GB", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const weekNumber = getISOWeekNumber(dayBegin);
  const separatorTitle = weekNumber ? `${fullDay} · Week ${weekNumber}` : fullDay;
  return {
    id: dayId,
    title: dayTitle,
    begin_time: dayBegin.toISOString(),
    end_time: dayEnd.toISOString(),
    separatorTitle,
    weekNumber,
    ...partial
  };
};
const insideOfDay = (item, dayDesc) => {
  const kind = typeof dayDesc == "string" ? dayDesc : dayDesc?.kind;
  const status = typeof dayDesc == "string" ? dayDesc : dayDesc?.status;
  const begin_time = typeof dayDesc == "string" ? dayDesc : dayDesc?.begin_time;
  const end_time = typeof dayDesc == "string" ? dayDesc : dayDesc?.end_time;
  const inRange = (!begin_time || getComparableTimeValue(item?.properties?.begin_time) >= getComparableTimeValue(begin_time) || String(begin_time)?.toLowerCase?.()?.trim?.() == "all") && (!end_time || getComparableTimeValue(item?.properties?.end_time) <= getComparableTimeValue(end_time) || String(end_time)?.toLowerCase?.()?.trim?.() == "all");
  const kindMatch = (kind ? item?.kind == kind || kind == "all" : false) || !item?.kind;
  const statusMatch = (status ? item?.properties?.status == status || status == "all" : !kindMatch) || !item?.properties?.status;
  return inRange || statusMatch || kindMatch;
};
const notInPast = (item, dayDesc = null) => {
  const kind = typeof dayDesc == "string" ? dayDesc : dayDesc?.kind;
  const status = typeof dayDesc == "string" ? dayDesc : dayDesc?.status;
  const end_time = typeof dayDesc == "string" ? dayDesc : dayDesc?.end_time;
  const now_time = getComparableTimeValue();
  const inRange = !end_time || getComparableTimeValue(end_time) >= now_time;
  const kindMatch = (kind ? item?.kind == kind || kind == "all" : false) || !item?.kind;
  const statusMatch = (status ? item?.properties?.status == status || status == "all" : !kindMatch) || !item?.properties?.status;
  return inRange || statusMatch || kindMatch;
};
const SplitTimelinesByDays = async (timelineMap, daysDesc = null) => {
  daysDesc ??= observe([]);
  if (!timelineMap) return daysDesc;
  for (const timeline of await timelineMap ?? []) {
    if (timeline?.properties?.begin_time && timeline?.properties?.end_time) {
      const beginTime = parseDateCorrectly(timeline?.properties?.begin_time);
      const endTime = parseDateCorrectly(timeline?.properties?.end_time);
      let day = daysDesc?.find?.((day2) => {
        return getComparableTimeValue(beginTime) >= getComparableTimeValue(day2?.begin_time) && getComparableTimeValue(endTime) <= getComparableTimeValue(day2?.end_time);
      }) ?? null;
      if (!day && getComparableTimeValue(endTime) >= getComparableTimeValue()) {
        const dayDescriptor = createDayDescriptor(beginTime, { status: "" });
        if (dayDescriptor) {
          daysDesc?.push?.(day ??= dayDescriptor);
        }
      }
    }
  }
  return daysDesc;
};
const computeTimelineOrderInGeneral = (timeOfDay, minTimestamp) => {
  const dayStart = getComparableTimeValue(timeOfDay) || 0;
  const normalized = (Number.isFinite(dayStart) ? dayStart : 0) - (minTimestamp || 0);
  return Math.round(normalized / (24 * 60 * 60 * 1e3));
};
const computeTimelineOrderInsideOfDay = (item, dayDesc) => {
  const beginTime = getComparableTimeValue(item?.properties?.begin_time) || 0;
  const endTime = getComparableTimeValue(item?.properties?.end_time) || 0;
  const fallback = Number.isFinite(beginTime) ? beginTime : endTime;
  if (!Number.isFinite(fallback)) return 0;
  if (!dayDesc || !dayDesc?.begin_time) {
    dayDesc = createDayDescriptor(parseDateCorrectly(fallback ?? null));
  }
  const dayStart = getComparableTimeValue(dayDesc?.begin_time) || 0;
  const normalized = Number.isFinite(dayStart) ? fallback - dayStart : fallback;
  return Math.round(normalized / (60 * 1e3));
};
const normalizeSchedule = (value) => {
  if (!value) return null;
  if (typeof value === "object" && (value.date || value.iso_date || value.timestamp)) {
    return value;
  }
  return { iso_date: String(value) };
};
const formatAsTime = (time) => {
  const normalized = normalizeSchedule(time);
  if (!normalized) return "";
  return parseDateCorrectly(normalized)?.toLocaleTimeString?.("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: getTimeZone()
  }) || "";
};
const formatAsDate = (date) => {
  return parseDateCorrectly(date)?.toLocaleDateString?.("en-GB", {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
    timeZone: getTimeZone()
  }) || "";
};
const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(void 0, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

"use strict";
const TIMELINE_DIR = "/timeline/";
const PREFERENCES_DIR = "/docs/preferences/";
const PLANS_DIR = "/docs/plans/";
const FACTORS_DIR = "/data/factors/";
const EVENTS_DIR = "/data/events/";
const filterTasks = (timeline, currentTime, maxDays = 7) => {
  return timeline?.filter?.((task) => checkRemainsTime(task?.properties?.begin_time, task?.properties?.end_time, currentTime, maxDays));
};
const filterFactors = (factors, currentTime, maxDays = 7) => {
  return factors?.filter?.((factor) => checkRemainsTime(factor?.properties?.begin_time, factor?.properties?.end_time, currentTime, maxDays));
};
const filterEvents = (events, currentTime, maxDays = 7) => {
  return events?.filter?.((event) => checkRemainsTime(event?.properties?.begin_time, event?.properties?.end_time, currentTime, maxDays));
};
const createTimelineGenerator = async (sourcePath = null, speechPrompt = null) => {
  const settings = await loadSettings();
  if (!settings || !settings?.ai || !settings.ai?.apiKey) return;
  const gptResponses = new GPTResponses(settings.ai?.apiKey || "", settings.ai?.baseUrl || "https://api.proxyapi.ru/openai/v1", "", settings.ai?.model || "gpt-5.2");
  console.log(gptResponses);
  await gptResponses?.giveForRequest?.(`factors: \`${encode(filterFactors(await readJSONs(FACTORS_DIR), realtimeStates?.time))}\`
`);
  await gptResponses?.giveForRequest?.(`events: \`${encode(filterEvents(await readJSONs(EVENTS_DIR), realtimeStates?.time))}\`
`);
  if (sourcePath) {
    await gptResponses?.giveForRequest?.(`preferences: \`\`\`${encode(await readOneMarkDown(sourcePath))}\`\`\`
`);
  } else if (!speechPrompt?.trim?.() || !speechPrompt?.trim?.()?.length) {
    await gptResponses?.giveForRequest?.(`preferences: Make generic working plan for next 7 days...
`);
  }
  if (speechPrompt?.trim?.() && speechPrompt?.trim?.()?.length) {
    await gptResponses?.giveForRequest?.(`speech_prompt: \`${encode(speechPrompt)}\`
`);
  }
  await gptResponses?.askToDoAction?.([
    `primary_request:`,
    "Analyze starting and existing data, and get be ready to make a new timeline (preferences data will be attached later)...",
    "Also, can you provide markdown pre-formatted verbose data about what you have analyzed and what you will do?",
    "Give ready status in JSON format: `{ ready: boolean, reason: string, verbose_data: string }`"
  ]?.join?.("\n"));
  const readyStatus = parseAIResponseSafe(await gptResponses?.sendRequest?.("high", "high") || '{ ready: false, reason: "No attached data", verbose_data: "" }');
  if (!readyStatus?.ok) {
    console.error("timeline", readyStatus?.error || "Failed to parse AI response");
    return { timeline: [], keywords: [] };
  }
  return readyStatus?.data;
};
const requestNewTimeline = async (gptResponses, existsTimeline = null) => {
  if (!gptResponses) return { timeline: [], keywords: [] };
  if (existsTimeline) {
    await gptResponses?.giveForRequest?.(`current_timeline: \`${encode(existsTimeline)}\`
`);
  }
  const userTimeZone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || "UTC";
  const timezoneOffset = (/* @__PURE__ */ new Date())?.getTimezoneOffset?.() || 0;
  const encodedRealtimeState = encode({
    time: realtimeStates.time?.toISOString?.(),
    timestamp: realtimeStates.timestamp,
    coords: realtimeStates.coords?.toJSON?.(),
    otherProps: realtimeStates.otherProps,
    cards: realtimeStates.cards,
    language: navigator?.language || "ru-RU",
    timezone: userTimeZone,
    timezoneOffset
  });
  await gptResponses?.giveForRequest?.(`current_states: \`${encodedRealtimeState}\`
`);
  await gptResponses?.giveForRequest?.(AI_OUTPUT_SCHEMA);
  await gptResponses?.askToDoAction?.([
    "Make timeline plan in JSON format, according to given schema. Follow by our preferences is was presented...",
    'Write in JSON format, `[ array of entity of "task" type ]`, according to given schema.'
  ].join?.("\n"));
  const existsResponseId = gptResponses?.getResponseId?.();
  const raw = await gptResponses?.sendRequest?.()?.catch?.(console.warn.bind(console));
  const timelines = raw ? parseAIResponseSafe(raw) : '{ ready: false, reason: "No attached data", keywords: [] }';
  gptResponses?.beginFromResponseId?.(existsResponseId);
  timelines?.forEach?.((entity) => fixEntityId(entity));
  console.log("timeline", timelines);
  return timelines;
};

export { createDayDescriptor, createTimelineGenerator, fixEntityId, formatDateTime, getISOWeekNumber, getTimeZone, insideOfDay, parseDateCorrectly, requestNewTimeline, writeTimelineTask };
//# sourceMappingURL=MakeTimeline.js.map
