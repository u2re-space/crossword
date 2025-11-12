import frontend from "./frontend/index";
import { UIPhosphorIcon } from "fest/icon";
console.log(UIPhosphorIcon);

//
export default async function bootstrap(mountElement) {
    frontend?.(mountElement);
}
