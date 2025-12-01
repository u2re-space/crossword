import frontend from "./frontend/index";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

//
export default async function bootstrap(mountElement) {

    //
    await navigator.permissions.query({ name: "storage-access" as PermissionName }).then((result) => {
        console.log("Storage access permission granted", result);
    })?.catch?.((error) => {
        console.log("Storage access permission denied", error);
    });

    //
    await navigator.permissions.query({ name: "top-level-storage-access" as PermissionName }).then((result) => {
        console.log("Top level storage access permission granted", result);
    })?.catch?.((error) => {
        console.log("Top level storage access permission denied", error);
    });

    //
    await document.requestStorageAccess()?.then?.((access) => {
        console.log("Storage access granted", access);
    })?.catch?.((error) => {
        console.log("Storage access denied", error);
    });

    await navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        console.log("Geolocation permission granted", result);
    })?.catch?.((error) => {
        console.log("Geolocation permission denied", error);
    });

    await navigator.permissions.query({ name: "clipboard-write" as PermissionName }).then((result) => {
        console.log("Clipboard write permission granted", result);
    })?.catch?.((error) => {
        console.log("Clipboard write permission denied", error);
    });

    await navigator.permissions.query({ name: "clipboard-read" as PermissionName }).then((result) => {
        console.log("Clipboard read permission granted", result);
    })?.catch?.((error) => {
        console.log("Clipboard read permission denied", error);
    });

    await navigator.permissions.query({ name: "notifications" as PermissionName }).then((result) => {
        console.log("Notifications permission granted", result);
    })?.catch?.((error) => {
        console.log("Notifications permission denied", error);
    });

    await navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
        console.log("Microphone permission granted", result);
    })?.catch?.((error) => {
        console.log("Microphone permission denied", error);
    });

    frontend?.(mountElement);
}
