//
export default async function bootstrap(mountElement) {
    import("./frontend/index.ts").then(({default: frontend}) => frontend(mountElement));
}
