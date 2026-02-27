import { createRequire } from 'node:module';
import config from "../config/config.ts";

type RobotButton = 'left' | 'right' | 'middle';
type RobotToggleState = 'down' | 'up';

interface RobotLike {
    getMousePos(): { x: number; y: number };
    moveMouse(x: number, y: number): void;
    mouseClick(button?: RobotButton, double?: boolean): void;
    mouseToggle(state: RobotToggleState, button?: RobotButton): void;
    scrollMouse(dx: number, dy: number): void;
    keyTap(key: string, modifier?: string | string[]): void;
    keyToggle(key: string, state: RobotToggleState): void;
    typeString(text: string): void;
}

const require = createRequire(import.meta.url);

let robotInstance: RobotLike | null = null;
let triedLoading = false;
let warnedUnavailable = false;
const parseBooleanValue = (value: unknown): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") return undefined;

    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (["0", "false", "off", "no", "disabled"].includes(normalized)) return false;
    if (["1", "true", "on", "yes", "enabled"].includes(normalized)) return true;
    return true;
};

const pickConfigFlag = (...candidates: unknown[]): boolean | undefined => {
    for (const item of candidates) {
        const parsed = parseBooleanValue(item);
        if (typeof parsed === "boolean") return parsed;
    }
    return undefined;
};

const robotJsEnv = pickConfigFlag(
    process.env.AIRPAD_ROBOTJS_ENABLED,
    process.env.ENDPOINT_ROBOTJS_ENABLED,
    process.env.ROBOTJS_ENABLED
);
const robotJsConfig = pickConfigFlag(
    (config as any)?.core?.robotJsEnabled,
    (config as any)?.core?.robotjsEnabled,
    (config as any)?.airpad?.robotJsEnabled,
    (config as any)?.airpad?.robotjsEnabled,
    (config as any)?.robotJsEnabled,
    (config as any)?.robotjsEnabled,
    (config as any)?.robotEnabled
);
const defaultRobotJsEnabled = process.platform === "win32";
const robotJsEnabled = robotJsEnv ?? robotJsConfig ?? defaultRobotJsEnabled;

function loadRobot(): RobotLike | null {
    if (triedLoading) return robotInstance;
    triedLoading = true;
    if (!robotJsEnabled) {
        robotInstance = null;
        return robotInstance;
    }

    try {
        robotInstance = require('robotjs') as RobotLike;
    } catch (error) {
        robotInstance = null;
        if (!warnedUnavailable) {
            warnedUnavailable = true;
            console.warn('[robot-adapter] robotjs is unavailable; falling back to alternative adapters (AHK if available).', error);
        }
    }

    return robotInstance;
}

export function getRobot(): RobotLike | null {
    return loadRobot();
}

export function hasRobot(): boolean {
    return loadRobot() !== null;
}

