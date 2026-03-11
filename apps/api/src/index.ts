import { buildServer } from "./server.js";
import { config } from "./config.js";

const app = await buildServer();

try {
  await app.listen({ port: config.API_PORT, host: "0.0.0.0" });
  app.log.info(`Shield API running on :${config.API_PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
