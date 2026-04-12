import { getAccessToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface ApiFetchOptions extends Omit<NonNullable<Parameters<typeof fetch>[1]>, "body"> {
  body?: BodyInit | Record<string, unknown>;
  query?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function buildUrl(path: string, query?: ApiFetchOptions["query"]) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_URL}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = getAccessToken();
  const { query, headers, body, ...rest } = options;

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: typeof body === "string" || body === undefined ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = "Erreur API";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // ignore json parsing errors for non-json responses
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
