import { createRequire } from 'node:module';

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

function loadRobot(): RobotLike | null {
    if (triedLoading) return robotInstance;
    triedLoading = true;

    try {
        robotInstance = require('robotjs') as RobotLike;
    } catch (error) {
        robotInstance = null;
        if (!warnedUnavailable) {
            warnedUnavailable = true;
            console.warn('[robot-adapter] robotjs is unavailable; mouse/keyboard automation will be disabled.', error);
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

