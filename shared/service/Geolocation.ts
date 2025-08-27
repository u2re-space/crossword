//
let watchId: number|null = null;
const boardcastChannel = new BroadcastChannel('geolocation');
const broadcast = (coords: GeolocationPosition) => {
    //navigator.sendBeacon('/api/geo', JSON.stringify(coords));
    boardcastChannel.postMessage(coords);
}

//
export const startTracking = () => {
    if (!('geolocation' in navigator)) return;
    watchId = navigator.geolocation.watchPosition(
        pos => broadcast(pos),
        err => console.error(err),
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
    );
}

//
export const stopTracking = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    boardcastChannel.postMessage({type: 'stop'});
}

//
boardcastChannel.onmessage = (e) => {
    if (e.data.type === 'start') {
        startTracking();
    } else if (e.data.type === 'stop') {
        stopTracking();
    }
}

//
export const getGeolocation = async () => {
    return new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
}

/* // in service worker
//
export const startTrackingRemote = () => {
    boardcastChannel.postMessage({type: 'start'});
}

//
export const stopTrackingRemote = () => {
    boardcastChannel.postMessage({type: 'stop'});
}
*/