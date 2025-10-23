import frontend from "./frontend/index";

//
export default async function bootstrap(mountElement) {
    console.log(mountElement);
    frontend?.(mountElement);
}
