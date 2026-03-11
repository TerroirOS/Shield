import { Queue } from "bullmq";

export type EvaluateJobPayload = {
  eventId: string;
  programId: string;
};

export type NotifyPayload = {
  subject: string;
  lines: string[];
};

export class JobQueue {
  private readonly evaluationQueue: Queue<any, any, string>;
  private readonly notificationQueue: Queue<any, any, string>;

  constructor(redisUrl: string) {
    const parsed = new URL(redisUrl);
    const connection = {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: parsed.username || undefined,
      password: parsed.password || undefined
    };

    this.evaluationQueue = new Queue("shield-evaluate", { connection });
    this.notificationQueue = new Queue("shield-notify", { connection });
  }

  async enqueueEvaluate(payload: EvaluateJobPayload): Promise<void> {
    await this.evaluationQueue.add("evaluate-event", payload, {
      attempts: 4,
      backoff: {
        type: "exponential",
        delay: 500
      }
    });
  }

  async enqueueNotify(payload: NotifyPayload): Promise<void> {
    await this.notificationQueue.add("notify", payload, { removeOnComplete: 20, removeOnFail: 20 });
  }

  async close(): Promise<void> {
    await Promise.all([this.evaluationQueue.close(), this.notificationQueue.close()]);
  }
}
