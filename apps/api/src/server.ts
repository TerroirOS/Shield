import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { Db } from "./db.js";
import { JobQueue } from "./worker-queue.js";
import { ShieldService } from "./services.js";
import { createConnectorSuite } from "@terroiros/connectors";
import { registerRoutes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildServer() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Shield API",
        version: "1.0.0"
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs"
  });

  app.get("/openapi.yaml", async (_, reply) => {
    const openapiPath = path.resolve(__dirname, "../../../spec/openapi/shield-api.v1.yaml");
    const content = await readFile(openapiPath, "utf-8");
    reply.type("text/yaml");
    return content;
  });

  const db = new Db(config.DATABASE_URL);
  await db.init();
  await db.seedDefaults();

  const queue = new JobQueue(config.REDIS_URL);
  const connectors = createConnectorSuite(config.SHIELD_RUNTIME_MODE);
  const service = new ShieldService(db, connectors, queue);

  await registerRoutes(app, { service, db });

  app.addHook("onClose", async () => {
    await queue.close();
    await db.close();
  });

  return app;
}
