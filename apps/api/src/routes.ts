import type { FastifyInstance } from "fastify";
import {
  caseFilterSchema,
  payoutPreviewRequestSchema,
  triggerEvaluationRequestSchema,
  weatherEventPacketSchema
} from "@terroiros/domain";
import { authenticate, requireRole } from "./security.js";
import { domainEventsCounter, httpRequestDuration, metricsRegistry } from "./metrics.js";
import type { ShieldService } from "./services.js";
import type { Db } from "./db.js";

function withMetrics<T extends (...args: any[]) => Promise<any>>(route: string, method: string, fn: T): T {
  return (async (...args: Parameters<T>) => {
    const end = httpRequestDuration.startTimer();
    try {
      const result = await fn(...args);
      end({ method, route, status: "200" });
      return result;
    } catch (error) {
      end({ method, route, status: "500" });
      throw error;
    }
  }) as T;
}

export async function registerRoutes(app: FastifyInstance, deps: { service: ShieldService; db: Db }) {
  app.get("/healthz", async () => ({ ok: true, service: "shield-api" }));

  app.get("/metrics", async (_req, reply) => {
    reply.type(metricsRegistry.contentType);
    return metricsRegistry.metrics();
  });

  app.post(
    "/v1/events/weather",
    { preHandler: [authenticate, requireRole(["ops", "admin"])] },
    withMetrics("/v1/events/weather", "POST", async (request, reply) => {
      const parsed = weatherEventPacketSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400);
        return { error: "invalid_event", details: parsed.error.flatten() };
      }

      const result = await deps.service.ingestWeatherEvent(parsed.data, request.auth!);
      domainEventsCounter.inc();
      reply.code(202);
      return result;
    })
  );

  app.post(
    "/v1/programs/:id/trigger-evaluations",
    { preHandler: [authenticate, requireRole(["ops", "admin"]) ] },
    withMetrics("/v1/programs/:id/trigger-evaluations", "POST", async (request, reply) => {
      const body = triggerEvaluationRequestSchema.safeParse(request.body);
      if (!body.success) {
        reply.code(400);
        return { error: "invalid_request", details: body.error.flatten() };
      }

      const payload = {
        eventId: body.data.eventId,
        enrollmentId: body.data.enrollmentId
      };

      const result = await deps.service.evaluateTriggerForEnrollment(payload);
      return result;
    })
  );

  app.post(
    "/v1/decisions/preview",
    { preHandler: [authenticate, requireRole(["ops", "admin", "auditor"]) ] },
    withMetrics("/v1/decisions/preview", "POST", async (request, reply) => {
      const parsed = payoutPreviewRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400);
        return { error: "invalid_request", details: parsed.error.flatten() };
      }

      const evaluation = await deps.db.getEvaluation(parsed.data.evaluationId);
      if (!evaluation) {
        reply.code(404);
        return { error: "evaluation_not_found" };
      }

      const decision = await deps.db
        .listDecisions(200)
        .then((decisions) => decisions.find((item) => item.evaluationId === evaluation.evaluationId));

      if (!decision) {
        reply.code(404);
        return { error: "decision_not_found" };
      }

      return {
        decision,
        reportedLoss: parsed.data.reportedLoss ?? null,
        gap: parsed.data.reportedLoss ? Math.abs(parsed.data.reportedLoss - decision.payoutAmount) : null
      };
    })
  );

  app.post(
    "/v1/decisions/:id/approve",
    { preHandler: [authenticate, requireRole(["ops", "admin"]) ] },
    withMetrics("/v1/decisions/:id/approve", "POST", async (request, reply) => {
      try {
        const decision = await deps.service.approveDecision((request.params as { id: string }).id, request.auth!);
        return { decision };
      } catch (error) {
        reply.code(404);
        return { error: String(error) };
      }
    })
  );

  app.post(
    "/v1/decisions/:id/export",
    { preHandler: [authenticate, requireRole(["ops", "admin"]) ] },
    withMetrics("/v1/decisions/:id/export", "POST", async (request, reply) => {
      try {
        const exported = await deps.service.exportDecision((request.params as { id: string }).id, request.auth!);
        return exported;
      } catch (error) {
        reply.code(404);
        return { error: String(error) };
      }
    })
  );

  app.get(
    "/v1/cases",
    { preHandler: [authenticate, requireRole(["ops", "admin", "auditor"]) ] },
    withMetrics("/v1/cases", "GET", async (request, reply) => {
      const parsed = caseFilterSchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        reply.code(400);
        return { error: "invalid_filters", details: parsed.error.flatten() };
      }

      const cases = await deps.db.listCases(parsed.data);
      return { cases };
    })
  );

  app.get(
    "/v1/cases/:id",
    { preHandler: [authenticate, requireRole(["ops", "admin", "auditor"]) ] },
    withMetrics("/v1/cases/:id", "GET", async (request, reply) => {
      const detail = await deps.service.buildCaseDetail((request.params as { id: string }).id);
      if (!detail) {
        reply.code(404);
        return { error: "case_not_found" };
      }

      return detail;
    })
  );

  app.get(
    "/v1/reports/public",
    { preHandler: [authenticate, requireRole(["ops", "admin", "auditor"]) ] },
    withMetrics("/v1/reports/public", "GET", async (request, reply) => {
      const query = request.query as { programId?: string };
      const programId = query.programId ?? "program-kakheti-2026";

      return deps.service.buildPublicReport(programId);
    })
  );

  app.get(
    "/v1/basis-risk/metrics",
    { preHandler: [authenticate, requireRole(["ops", "admin", "auditor"]) ] },
    withMetrics("/v1/basis-risk/metrics", "GET", async (request) => {
      const query = request.query as { programId?: string };
      const programId = query.programId ?? "program-kakheti-2026";
      return deps.service.basisRiskMetrics(programId);
    })
  );

  app.post("/v1/internal/jobs/evaluate", async (request, reply) => {
    const token = request.headers["x-internal-token"];
    if (token !== process.env.INTERNAL_JOB_TOKEN) {
      reply.code(401);
      return { error: "unauthorized_internal" };
    }

    const body = request.body as { eventId?: string };
    if (!body?.eventId) {
      reply.code(400);
      return { error: "missing_event_id" };
    }

    const results = await deps.service.evaluateAllForEvent(body.eventId);
    return { processed: results.length };
  });
}
