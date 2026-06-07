/**
 * BFF/Proxy Route — app/api/[[...path]]/route.ts
 *
 * Catch-all route handler that:
 * 1. Validates the current better-auth session.
 * 2. Builds a signed user-context header for Express (HMAC-SHA256).
 * 3. Forwards the request to the backend Express API.
 * 4. Streams the backend response back to the browser.
 *
 * Requirements: 18.7, 17.2
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { signContext } from "@/lib/hmac";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://localhost:4000";
const INTERNAL_JWT_SECRET = process.env.INTERNAL_JWT_SECRET ?? "";
const ACTIVE_WORKSPACE_COOKIE = "ACTIVE_WORKSPACE_ID";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a request-id (UUID v4 compatible via crypto). */
function generateRequestId(): string {
  // Use crypto.randomUUID if available (Node 14.17+), otherwise fallback.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: hex timestamp + random
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/** Extract the path segments from the Next.js catch-all params. */
function resolvePath(params: { path?: string[] }): string {
  if (!params.path || params.path.length === 0) return "";
  return "/" + params.path.join("/");
}

// ---------------------------------------------------------------------------
// Core proxy handler
// ---------------------------------------------------------------------------

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  // 1. Resolve session (better-auth server-side)
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Session tidak valid atau sudah berakhir." },
      },
      { status: 401 }
    );
  }

  // 2. Resolve active workspace from cookie (v1: single workspace per user).
  //    The workspace_id stored in the cookie was set by the backend after login
  //    or workspace resolution. Fall back to a placeholder for now.
  const workspaceId =
    req.cookies.get(ACTIVE_WORKSPACE_COOKIE)?.value ?? "";

  // 3. Build user-context payload
  const userContextPayload = {
    authUserId: session.user.id,
    email: session.user.email,
    fullName: session.user.name ?? "",
    workspaceId,
  };

  // 4. Sign the user context
  if (!INTERNAL_JWT_SECRET) {
    console.error("[BFF] INTERNAL_JWT_SECRET is not set");
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Server configuration error." },
      },
      { status: 500 }
    );
  }

  const { contextHeader, sigHeader } = signContext(
    userContextPayload,
    INTERNAL_JWT_SECRET
  );

  // 5. Build target URL
  const params = await context.params;
  const path = resolvePath(params);
  const backendUrl = new URL(
    `/api/v1${path}`,
    BACKEND_URL
  );

  // Forward query string
  req.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  // 6. Build forwarded headers — drop host, inject user-context
  const requestId =
    req.headers.get("x-request-id") ?? generateRequestId();

  const forwardedHeaders = new Headers();
  req.headers.forEach((value, key) => {
    // Drop headers that must not be forwarded
    const lower = key.toLowerCase();
    if (
      lower === "host" ||
      lower === "x-user-context" ||
      lower === "x-user-context-sig"
    ) {
      return;
    }
    forwardedHeaders.set(key, value);
  });

  forwardedHeaders.set("x-user-context", contextHeader);
  forwardedHeaders.set("x-user-context-sig", sigHeader);
  forwardedHeaders.set("x-request-id", requestId);

  // 7. Build fetch init — include body for mutating methods
  const method = req.method.toUpperCase();
  const hasBody = ["POST", "PATCH", "PUT", "DELETE"].includes(method) &&
    req.headers.get("content-length") !== "0";

  let body: BodyInit | undefined;
  if (hasBody && req.body) {
    body = req.body as BodyInit;
  }

  // 8. Forward to Express
  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl.toString(), {
      method,
      headers: forwardedHeaders,
      body,
      // @ts-expect-error — Node 18+ supports duplex for streaming
      duplex: body ? "half" : undefined,
    });
  } catch (err) {
    console.error("[BFF] Failed to reach backend:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Backend tidak dapat dihubungi. Coba lagi nanti.",
        },
      },
      { status: 502 }
    );
  }

  // 9. Pass-through the backend response (headers + status + body)
  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    // Skip headers that Next.js manages itself
    const lower = key.toLowerCase();
    if (lower === "transfer-encoding" || lower === "connection") return;
    responseHeaders.set(key, value);
  });

  // Propagate request-id back to the browser
  responseHeaders.set("x-request-id", requestId);

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

// ---------------------------------------------------------------------------
// Export HTTP method handlers
// ---------------------------------------------------------------------------
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
