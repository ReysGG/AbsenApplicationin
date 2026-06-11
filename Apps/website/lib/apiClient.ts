/**
 * lib/apiClient.ts
 *
 * Typed API client for calling the BFF proxy route (`/api/[...path]`).
 *
 * Two variants:
 *  - createServerApiClient() — for Server Components; uses absolute URL so
 *    Next.js can route the request correctly during SSR.
 *  - createClientApiClient() — for Client Components; uses a relative URL
 *    that the browser resolves automatically.
 *
 * Both variants call the BFF (/api/...) which in turn signs the user context
 * and proxies to Express. Authentication is handled at the BFF layer — the
 * API client itself is intentionally thin.
 *
 * Requirements: 18.7
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Pagination wrapper returned by list endpoints
export type PaginatedData<T> = {
  data: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

interface RequestOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}

async function apiFetch<T>(
  options: RequestOptions,
  path: string,
  init: RequestInit & { params?: Record<string, string> }
): Promise<ApiResponse<T>> {
  const { baseUrl, headers: defaultHeaders = {} } = options;
  const { params, ...fetchInit } = init;

  // Build URL — strip leading slash from path to avoid double-slash.
  // `baseUrl` may be relative (client client uses "/api"); new URL() requires
  // an absolute URL, so resolve relative bases against the current origin.
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const rawUrl = `${baseUrl}/${cleanPath}`;
  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const url = /^https?:\/\//.test(rawUrl)
    ? new URL(rawUrl)
    : new URL(rawUrl, origin ?? "http://localhost");

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    ...fetchInit,
    headers: {
      "Content-Type": "application/json",
      ...defaultHeaders,
      ...(fetchInit.headers as Record<string, string> | undefined),
    },
  });

  // Parse JSON — backend returns the ApiResponse shape.
  const json = (await response.json()) as
    | (ApiSuccess<unknown> & { pagination?: unknown })
    | ApiError;

  // Normalize paginated list responses to PaginatedData nested under `data`:
  //   { success, data: { data: [...], pagination: {...} } }
  // The backend uses two flavours:
  //   (a) FLAT:   { success, data: [...], pagination: {...} }
  //   (b) NESTED: { success, data: { items: [...], pagination: {...} } }  (e.g. audit-logs)
  // Re-shape both so list pages reading `res.data.data` + `res.data.pagination` work.
  if (json.success) {
    // (a) flat: pagination is a sibling of data, data is an array
    if (
      "pagination" in json &&
      json.pagination !== undefined &&
      Array.isArray((json as { data?: unknown }).data)
    ) {
      return {
        success: true,
        data: { data: json.data, pagination: json.pagination },
        message: json.message,
      } as unknown as ApiResponse<T>;
    }
    // (b) nested: data is an object holding `items` + `pagination`
    const d = (json as { data?: unknown }).data as
      | { items?: unknown; pagination?: unknown }
      | undefined;
    if (d && typeof d === "object" && Array.isArray(d.items) && d.pagination) {
      return {
        success: true,
        data: { data: d.items, pagination: d.pagination },
        message: json.message,
      } as unknown as ApiResponse<T>;
    }
  }

  return json as ApiResponse<T>;
}

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

export interface ApiClient {
  /** GET /api/{path}?{params} */
  get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>>;
  /** POST /api/{path} */
  post<T>(path: string, body: unknown): Promise<ApiResponse<T>>;
  /** PATCH /api/{path} */
  patch<T>(path: string, body: unknown): Promise<ApiResponse<T>>;
  /** PUT /api/{path} */
  put<T>(path: string, body: unknown): Promise<ApiResponse<T>>;
  /** DELETE /api/{path} */
  del<T>(path: string): Promise<ApiResponse<T>>;
}

function createApiClient(baseUrl: string, defaultHeaders: Record<string, string> = {}): ApiClient {
  const options: RequestOptions = { baseUrl, headers: defaultHeaders };

  return {
    get: <T>(path: string, params?: Record<string, string>) =>
      apiFetch<T>(options, path, { method: "GET", params }),

    post: <T>(path: string, body: unknown) =>
      apiFetch<T>(options, path, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    patch: <T>(path: string, body: unknown) =>
      apiFetch<T>(options, path, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    put: <T>(path: string, body: unknown) =>
      apiFetch<T>(options, path, {
        method: "PUT",
        body: JSON.stringify(body),
      }),

    del: <T>(path: string) =>
      apiFetch<T>(options, path, { method: "DELETE" }),
  };
}

// ---------------------------------------------------------------------------
// Exported factory functions
// ---------------------------------------------------------------------------

/**
 * For use in **Server Components** — Next.js SSR requires an absolute URL
 * when calling internal API routes from server-side code.
 *
 * Pass `requestHeaders` (from `await headers()`) to forward cookies so the
 * BFF proxy can resolve the better-auth session.
 *
 * IMPORTANT: server-side code runs INSIDE the container/host and must call the
 * app on the port it actually listens on (PORT, default 3000) — NOT the public
 * NEXT_PUBLIC_APP_URL (e.g. http://localhost:10000), which is the host-mapped
 * port and is unreachable from inside the container. Use INTERNAL_APP_URL to
 * override explicitly if needed.
 */
export function createServerApiClient(requestHeaders?: Headers): ApiClient {
  const port = process.env.PORT ?? "3000";
  const appUrl =
    process.env.INTERNAL_APP_URL ?? `http://localhost:${port}`;
  const baseUrl = `${appUrl}/api`;

  // Forward Cookie header so the BFF can validate the better-auth session
  const forwardedHeaders: Record<string, string> = {};
  if (requestHeaders) {
    const cookie = requestHeaders.get("cookie");
    if (cookie) {
      forwardedHeaders["cookie"] = cookie;
    }
  }

  return createApiClient(baseUrl, forwardedHeaders);
}

/**
 * For use in **Client Components** — uses a relative path that the browser
 * resolves relative to the current origin. Cookies are forwarded automatically
 * by the browser.
 */
export function createClientApiClient(): ApiClient {
  return createApiClient("/api");
}
