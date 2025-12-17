import frontend from "./frontend/index";

//
export default async function bootstrap(mountElement) {
    frontend?.(mountElement);
}
