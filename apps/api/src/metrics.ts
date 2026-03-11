import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestDuration = new Histogram({
  name: "shield_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"] as const,
  registers: [metricsRegistry],
  buckets: [0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

export const domainEventsCounter = new Counter({
  name: "shield_events_ingested_total",
  help: "Count of ingested weather events",
  registers: [metricsRegistry]
});
