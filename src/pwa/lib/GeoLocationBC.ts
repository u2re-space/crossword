import { idbStorage } from "../../core/store/IDBQueue";

//
const boardcastChannel = new BroadcastChannel('geolocation');

//
export const startTrackingRemote = () => {
    boardcastChannel.postMessage({ type: 'start' });
}

//
export const stopTrackingRemote = () => {
    boardcastChannel.postMessage({ type: 'stop' });
}

//
boardcastChannel.onmessage = (e) => {
    idbStorage.put(e.data.key, e.data.value);
}

//
self.addEventListener('message', (e) => {
    //if (e.data.type === 'start') startTrackingRemote();
    //if (e.data.type === 'stop') stopTrackingRemote();

    // for testing
    startTrackingRemote();
});
