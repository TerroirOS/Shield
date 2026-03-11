import type { FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Role } from "@terroiros/domain";
import { config } from "./config.js";

export type AuthContext = {
  userId: string;
  roles: Role[];
};

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

const jwks = createRemoteJWKSet(new URL(config.OIDC_JWKS_URI));

function roleList(value: unknown): Role[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Role => item === "ops" || item === "auditor" || item === "admin");
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (config.AUTH_DEV_MODE) {
    const devRole = (request.headers["x-user-role"] as string | undefined) ?? "admin";
    const devUser = (request.headers["x-user-id"] as string | undefined) ?? "dev-user";
    request.auth = {
      userId: devUser,
      roles: roleList([devRole])
    };
    return;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "missing_bearer_token" });
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    const verified = await jwtVerify(token, jwks, {
      issuer: config.OIDC_ISSUER_URL,
      audience: config.OIDC_AUDIENCE
    });

    const realmRoles = (verified.payload.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
    request.auth = {
      userId: String(verified.payload.sub ?? "unknown"),
      roles: roleList(realmRoles)
    };
  } catch (error) {
    reply.code(401).send({ error: "invalid_token", details: String(error) });
  }
}

export function requireRole(allowedRoles: Role[]) {
  return async function roleGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.auth) {
      reply.code(401).send({ error: "missing_auth" });
      return;
    }

    if (!request.auth.roles.some((role) => allowedRoles.includes(role))) {
      reply.code(403).send({ error: "forbidden", required: allowedRoles });
    }
  };
}
