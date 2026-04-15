import type {
  BackendCriterion,
  ParameterOption,
  RatingRequest,
  SearchMode,
  SearchRequest,
  SearchResponse
} from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "/api";

interface HttpErrorPayload {
  message?: string;
  detail?: string;
  error?: string;
}

class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: HttpErrorPayload
  ) {
    super(message);
    this.name = "HttpError";
  }
}

class InvalidApiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidApiResponseError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | null => (typeof value === "string" ? value : null);

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  if (!value.every((item) => typeof item === "string")) {
    return null;
  }

  return value;
};

const buildUrl = (path: string, query?: Record<string, string>): string => {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value.trim()) {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
};

const parseErrorMessage = (status: number, payload?: HttpErrorPayload): string => {
  const backendMessage = payload?.message ?? payload?.detail ?? payload?.error;
  if (backendMessage) {
    return backendMessage;
  }

  if (status >= 500) {
    return "Сервер временно недоступен. Повторите попытку позже.";
  }

  if (status === 404) {
    return "Запрошенный ресурс не найден.";
  }

  if (status === 401 || status === 403) {
    return "Недостаточно прав для выполнения операции.";
  }

  return "Ошибка запроса к API.";
};

const request = async <T>(path: string, init?: RequestInit, query?: Record<string, string>): Promise<T> => {
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? ((await response.json()) as unknown) : undefined;

  if (!response.ok) {
    const errorPayload = payload as HttpErrorPayload | undefined;
    throw new HttpError(parseErrorMessage(response.status, errorPayload), response.status, errorPayload);
  }

  return payload as T;
};

type BackendParameterDto = {
  id: string;
  label?: string;
  name?: string;
};

type BackendCriterionDto = {
  id: string;
  required?: boolean;
  name?: string;
  label?: string;
  units?: string[];
  unitOptions?: string[];
};

const mapParameter = (item: BackendParameterDto): ParameterOption => ({
  id: item.id,
  label: item.label ?? item.name ?? item.id
});

const mapCriterion = (item: BackendCriterionDto): BackendCriterion => ({
  id: item.id,
  required: Boolean(item.required),
  name: item.name ?? item.label ?? item.id,
  units: item.units ?? item.unitOptions ?? []
});

const parseParametersResponse = (payload: unknown): BackendParameterDto[] => {
  if (!Array.isArray(payload)) {
    throw new InvalidApiResponseError("Некорректный ответ API: ожидается список параметров.");
  }

  return payload.map((item) => {
    if (!isRecord(item)) {
      throw new InvalidApiResponseError("Некорректный параметр в ответе API.");
    }

    const id = asString(item.id);
    const label = asString(item.label);
    const name = asString(item.name);

    if (!id) {
      throw new InvalidApiResponseError("Некорректный параметр: отсутствует строковое поле id.");
    }

    return { id, label: label ?? undefined, name: name ?? undefined };
  });
};

const parseCriteriaResponse = (payload: unknown): BackendCriterionDto[] => {
  if (!Array.isArray(payload)) {
    throw new InvalidApiResponseError("Некорректный ответ API: ожидается список критериев.");
  }

  return payload.map((item) => {
    if (!isRecord(item)) {
      throw new InvalidApiResponseError("Некорректный критерий в ответе API.");
    }

    const id = asString(item.id);
    if (!id) {
      throw new InvalidApiResponseError("Некорректный критерий: отсутствует строковое поле id.");
    }

    const required = typeof item.required === "boolean" ? item.required : undefined;
    const name = asString(item.name) ?? undefined;
    const label = asString(item.label) ?? undefined;
    const units = asStringArray(item.units) ?? undefined;
    const unitOptions = asStringArray(item.unitOptions) ?? undefined;

    return { id, required, name, label, units, unitOptions };
  });
};

const parseSearchResponse = (payload: unknown): SearchResponse => {
  if (!isRecord(payload)) {
    throw new InvalidApiResponseError("Некорректный ответ API: ожидается объект результата поиска.");
  }

  const text = asString(payload.text);
  if (!text) {
    throw new InvalidApiResponseError("Некорректный ответ API: отсутствует строковое поле text.");
  }

  return { text };
};

export const metrologyApi = {
  async fetchParameters(mode: SearchMode, query: string): Promise<ParameterOption[]> {
    const rawResponse = await request<unknown>("/parameters", undefined, {
      mode,
      q: query
    });
    const response = parseParametersResponse(rawResponse);
    return response.map(mapParameter);
  },

  async fetchCriteria(parameterId: string): Promise<BackendCriterion[]> {
    const rawResponse = await request<unknown>(
      `/parameters/${encodeURIComponent(parameterId)}/criteria`
    );
    const response = parseCriteriaResponse(rawResponse);
    return response.map(mapCriterion);
  },

  async searchDocuments(payload: SearchRequest): Promise<SearchResponse> {
    const rawResponse = await request<unknown>("/documents/search", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return parseSearchResponse(rawResponse);
  },

  async submitRating(payload: RatingRequest): Promise<void> {
    await request<void>("/ratings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
