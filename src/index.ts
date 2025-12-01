import frontend from "./frontend/index";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

//
export default async function bootstrap(mountElement) {

    await Promise.allSettled([
        document.requestStorageAccess(),
        navigator.permissions.query({ name: "storage-access" as PermissionName }),
        navigator.permissions.query({ name: "top-level-storage-access" as PermissionName }),
        navigator.permissions.query({ name: "geolocation" as PermissionName }),
        navigator.permissions.query({ name: "clipboard-write" as PermissionName }),
        navigator.permissions.query({ name: "clipboard-read" as PermissionName }),
        navigator.permissions.query({ name: "notifications" as PermissionName }),
        navigator.permissions.query({ name: "microphone" as PermissionName }),
    ]).then((results) => {
        console.log("Permissions granted", results);
    })?.catch?.((error) => {
        console.log("Permissions denied", error);
    });

    //
    frontend?.(mountElement);
}
