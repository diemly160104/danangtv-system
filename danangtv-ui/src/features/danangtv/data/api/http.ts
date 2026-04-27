import { getStoredSessionUser } from "./sessionUser";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

type ApiRequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: ApiRequestOptions["query"]) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { query, headers, body, ...rest } = options;
  const url = buildUrl(path, query);

  const finalHeaders = new Headers(headers || {});
  const isFormData = body instanceof FormData;

  if (body && !isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const sessionUser = getStoredSessionUser();
  if (sessionUser?.user_id && !finalHeaders.has("x-user-id")) {
    finalHeaders.set("x-user-id", sessionUser.user_id);
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `API ${response.status} ${response.statusText}`;

    throw new Error(message);
  }

  if (data !== null) {
    return data as T;
  }

  return undefined as T;
}