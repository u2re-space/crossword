import { writeTimelineTask } from "./FileSystem";
import { fixEntityId } from "@rs-core/template/EntityId";

// Debug configuration
const DEBUG_IMMITATE = 10 * 1000; // 10 seconds
const DEBUG_ENABLED = true; // Set to false to disable debug mode

// Sample task templates for different kinds
const TASK_TEMPLATES = [
    {
        kind: "job",
        name: "Debug Job Task",
        description: "This is a debug job task generated for testing purposes. It includes all necessary properties and follows the entity structure.",
        status: "pending",
        icon: "briefcase",
        variant: "blue"
    },
    {
        kind: "action",
        name: "Debug Action Task",
        description: "This is a debug action task generated for testing. It simulates a typical action that might be part of a daily routine.",
        status: "in_progress",
        icon: "play-circle",
        variant: "green"
    },
    {
        kind: "other",
        name: "Debug Other Task",
        description: "This is a debug task of 'other' kind. It represents miscellaneous tasks that don't fit into specific categories.",
        status: "under_consideration",
        icon: "question-mark-circle",
        variant: "orange"
    }
];

// Sample locations for tasks
const SAMPLE_LOCATIONS = [
    "Office",
    "Home",
    "Gym",
    "Coffee Shop",
    "Library",
    "Park",
    "Shopping Mall",
    "Restaurant"
];

// Sample contacts
const SAMPLE_CONTACTS = [
    {
        email: ["debug@example.com"],
        phone: ["+1234567890"],
        links: ["https://example.com"]
    },
    {
        email: ["test@example.com"],
        phone: ["+0987654321"]
    }
];

/**
 * Generates a random debug task with realistic properties
 */
export const generateDebugTask = (): any => {
    const now = new Date();
    const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];

    // Generate random time for the task (within next 7 days)
    const daysOffset = Math.floor(Math.random() * 7);
    const hoursOffset = Math.floor(Math.random() * 24);
    const minutesOffset = Math.floor(Math.random() * 60);

    const beginTime = new Date(now);
    beginTime.setDate(beginTime.getDate() + daysOffset);
    beginTime.setHours(beginTime.getHours() + hoursOffset);
    beginTime.setMinutes(beginTime.getMinutes() + minutesOffset);

    // End time is 1-4 hours after begin time
    const durationHours = 1 + Math.floor(Math.random() * 3);
    const endTime = new Date(beginTime);
    endTime.setHours(endTime.getHours() + durationHours);

    const location = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
    const contacts = SAMPLE_CONTACTS[Math.floor(Math.random() * SAMPLE_CONTACTS.length)];

    const task = {
        type: "task",
        kind: template.kind,
        name: `${template.name} ${Date.now()}`,
        title: template.name,
        description: template.description,
        icon: template.icon,
        variant: template.variant,
        properties: {
            status: template.status,
            begin_time: {
                timestamp: beginTime.getTime(),
                iso_date: beginTime.toISOString()
            },
            end_time: {
                timestamp: endTime.getTime(),
                iso_date: endTime.toISOString()
            },
            location: location,
            contacts: contacts,
            members: [],
            events: []
        }
    };

    // Fix the entity ID to follow the naming convention
    fixEntityId(task as any, { mutate: true });

    return task;
};

/**
 * Generates multiple debug tasks
 */
export const generateDebugTasks = (count: number = 3): any[] => {
    const tasks: any[] = [];
    for (let i = 0; i < count; i++) {
        tasks.push(generateDebugTask());
    }
    return tasks;
};

/**
 * Writes debug tasks to the timeline
 */
export const writeDebugTasks = async (taskCount: number = 1): Promise<any[]> => {
    if (!DEBUG_ENABLED) {
        console.log("Debug task generation is disabled");
        return [];
    }

    const tasks = generateDebugTasks(taskCount);
    const results: any[] = [];

    for (const task of tasks) {
        try {
            const result = await writeTimelineTask(task);
            results.push(result);
            console.log("Debug task written:", task.name, task.id);
        } catch (error) {
            console.warn("Failed to write debug task:", error);
        }
    }

    return results;
};

/**
 * Auto-generates debug tasks on page refresh and via setTimeout
 */
export const startDebugTaskGeneration = (): void => {
    if (!DEBUG_ENABLED) {
        console.log("Debug task generation is disabled");
        return;
    }

    console.log("Starting debug task generation...");

    // Generate initial task on page load
    //writeDebugTasks(1).catch(console.warn);

    // Set up periodic generation
    const generatePeriodically = () => {
        setTimeout(async () => {
            if (DEBUG_ENABLED) {
                await writeDebugTasks(1);
                generatePeriodically(); // Schedule next generation
            }
        }, DEBUG_IMMITATE);
    };

    //generatePeriodically();
};

/**
 * Manual trigger for debug task generation
 */
export const triggerDebugTaskGeneration = (count: number = 1): Promise<any[]> => {
    if (!DEBUG_ENABLED) {
        console.log("Debug task generation is disabled");
        return Promise.resolve([]);
    }

    return writeDebugTasks(count);
};

/**
 * Enable or disable debug mode
 */
export const setDebugMode = (enabled: boolean): void => {
    (globalThis as any).DEBUG_ENABLED = enabled;
    console.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
};

/**
 * Get current debug mode status
 */
export const isDebugModeEnabled = (): boolean => {
    return DEBUG_ENABLED;
};

// Expose debug functions to global scope for easy testing
if (typeof globalThis !== 'undefined') {
    (globalThis as any).debugTaskGenerator = {
        generate: triggerDebugTaskGeneration,
        setMode: setDebugMode,
        isEnabled: isDebugModeEnabled
    };
}
