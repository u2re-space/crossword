import { startCoreBackend } from "./fastify-server.ts";

startCoreBackend().catch((err: Error) => {
    console.error(err);
    process.exit(1);
});
