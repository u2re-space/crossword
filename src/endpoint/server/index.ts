import { startCoreBackend } from "./src/fastify-server.ts";

startCoreBackend().catch((err: Error) => {
    console.error(err);
    process.exit(1);
});
