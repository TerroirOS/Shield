import { Worker } from "bullmq";
import { config } from "./config.js";

const parsed = new URL(config.REDIS_URL);
const connection = {
  host: parsed.hostname,
  port: Number(parsed.port || 6379),
  username: parsed.username || undefined,
  password: parsed.password || undefined
};

const evaluateWorker = new Worker(
  "shield-evaluate",
  async (job) => {
    const payload = job.data as { eventId: string; programId: string };

    const response = await fetch(`${config.API_BASE_URL}/v1/internal/jobs/evaluate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-token": config.INTERNAL_JOB_TOKEN
      },
      body: JSON.stringify({ eventId: payload.eventId, programId: payload.programId })
    });

    if (!response.ok) {
      throw new Error(`Failed to evaluate event ${payload.eventId}: ${response.status}`);
    }

    return response.json();
  },
  { connection }
);

const notifyWorker = new Worker(
  "shield-notify",
  async (job) => {
    const payload = job.data as { subject: string; lines: string[] };
    console.log(`[notify] ${payload.subject}`);
    payload.lines.forEach((line) => console.log(`- ${line}`));
    return { delivered: true };
  },
  { connection }
);

evaluateWorker.on("completed", (job) => {
  console.log(`[worker] evaluate completed: ${job.id}`);
});

evaluateWorker.on("failed", (job, error) => {
  console.error(`[worker] evaluate failed: ${job?.id} ${error.message}`);
});

notifyWorker.on("completed", (job) => {
  console.log(`[worker] notify completed: ${job.id}`);
});

notifyWorker.on("failed", (job, error) => {
  console.error(`[worker] notify failed: ${job?.id} ${error.message}`);
});

console.log("Shield worker started");

async function shutdown(signal: string) {
  console.log(`Shutting down worker due to ${signal}`);
  await Promise.all([evaluateWorker.close(), notifyWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
