import { writeFileSmart } from "@rs-core/workers/WriteFileSmart-v2";

//
export const sampleTasks = [
    //{ desc: { name: 't1', title: 'Plan morning', description: 'Make coffee, review emails', icon: 'coffee', variant: 'blur' }, properties: { status: 'canceled', begin_time: '12:00', end_time: '13:00' }, kind: 'personal' },
    //{ desc: { name: 't2', title: 'Design meeting', description: 'Sync with product team', icon: 'users', variant: 'purple' }, properties: { status: 'canceled', begin_time: '14:00', end_time: '15:00' }, kind: 'work' },
    //{ desc: { name: 't3', title: 'Grocery', description: 'Buy milk and bread', icon: 'shopping-cart', variant: 'green' }, properties: { status: 'canceled', begin_time: '16:00', end_time: '20:00' }, kind: 'errand' }
];

//
export const writeSampleTask = async (task: any) => {
    const fileName = `${task?.desc?.name}.json`;
    const file = new File([JSON.stringify(task)], fileName, { type: 'application/json' });
    return writeFileSmart(null, `/timeline/`, file, { ensureJson: true })?.catch?.(console.warn.bind(console));
}
