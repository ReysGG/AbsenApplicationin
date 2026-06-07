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

  // Build URL — strip leading slash from path to avoid double-slash
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(`${baseUrl}/${cleanPath}`);

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

  // Parse JSON — backend always returns ApiResponse shape
  const json = (await response.json()) as ApiResponse<T>;
  return json;
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

function createApiClient(baseUrl: string): ApiClient {
  const options: RequestOptions = { baseUrl };

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
 * The URL defaults to NEXT_PUBLIC_APP_URL or http://localhost:3000.
 */
export function createServerApiClient(): ApiClient {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const baseUrl = `${appUrl}/api`;
  return createApiClient(baseUrl);
}

/**
 * For use in **Client Components** — uses a relative path that the browser
 * resolves relative to the current origin.
 */
export function createClientApiClient(): ApiClient {
  return createApiClient("/api");
}
