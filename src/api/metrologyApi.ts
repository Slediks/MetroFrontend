import type {
  AuthResponse,
  BackendCriterion,
  FoundDocument,
  LoginRequest,
  ParameterOption,
  RatingRequest,
  SearchMode,
  SearchRequest,
  SearchResponse
} from "../types";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
// Login
const TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000;

const issueToken = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `metro_${crypto.randomUUID()}`;
  }

  return `metro_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};
// Login end

const parameterByMode: Record<SearchMode, ParameterOption[]> = {
  Измеряет: [
    { id: "mass", label: "Масса" },
    { id: "temperature", label: "Температура" },
    { id: "pressure", label: "Давление" },
    { id: "frequency", label: "Частота" },
    { id: "flow", label: "Расход" }
  ],
  Выдает: [
    { id: "voltage", label: "Напряжение" },
    { id: "current", label: "Ток" },
    { id: "resistance", label: "Сопротивление" },
    { id: "signal_power", label: "Мощность сигнала" },
    { id: "time", label: "Время" }
  ]
};

const criteriaByParameter: Record<string, BackendCriterion[]> = {
  mass: [
    { id: "mass_nominal", required: true, name: "Номинальная масса", units: ["кг", "г"] },
    { id: "mass_error", required: false, name: "Погрешность взвешивания", units: ["%", "г"] },
    { id: "response_time", required: false, name: "Время отклика", units: ["с"] }
  ],
  temperature: [
    { id: "temp_range", required: true, name: "Диапазон температуры", units: ["°C", "K"] },
    { id: "temp_accuracy", required: false, name: "Точность измерения", units: ["°C"] },
    { id: "ambient_humidity", required: false, name: "Влажность среды", units: ["%"] }
  ],
  pressure: [
    { id: "pressure_nominal", required: true, name: "Номинальное давление", units: ["Па", "кПа", "бар"] },
    { id: "pressure_sensitivity", required: false, name: "Чувствительность", units: ["Па"] }
  ],
  frequency: [
    { id: "freq_band", required: true, name: "Частотный диапазон", units: ["Гц", "кГц", "МГц"] },
    { id: "freq_drift", required: false, name: "Дрейф частоты", units: ["ppm"] }
  ],
  flow: [],
  voltage: [
    { id: "voltage_output", required: true, name: "Выходное напряжение", units: ["В", "мВ"] },
    { id: "voltage_noise", required: false, name: "Шум", units: ["мкВ"] },
    { id: "stability", required: false, name: "Стабильность", units: ["%"] }
  ],
  current: [
    { id: "current_output", required: true, name: "Выходной ток", units: ["А", "мА"] },
    { id: "current_ripple", required: false, name: "Пульсации", units: ["мА"] }
  ],
  resistance: [
    { id: "res_nominal", required: true, name: "Номинальное сопротивление", units: ["Ом", "кОм", "МОм"] },
    { id: "res_tolerance", required: false, name: "Допуск", units: ["%"] }
  ],
  signal_power: [
    { id: "power_nominal", required: true, name: "Номинальная мощность", units: ["Вт", "мВт"] },
    { id: "power_peak", required: false, name: "Пиковая мощность", units: ["Вт"] }
  ],
  time: [
    { id: "time_step", required: true, name: "Шаг времени", units: ["с", "мс"] },
    { id: "sync_error", required: false, name: "Ошибка синхронизации", units: ["мс"] }
  ]
};

const fallbackDocuments: FoundDocument[] = [
  { id: "mi-001-2026", fileName: "МИ_001-2026.pdf" },
  { id: "rmg-142-2024", fileName: "РМГ_142-2024.pdf" },
  { id: "gost-8-009-2020", fileName: "ГОСТ_8.009-2020.pdf" }
];

// Login
const getApiUrl = (path: string): string => {
  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
};

const normalizeAuthResponse = (
  data: { token?: unknown; expiresAt?: unknown },
  fallbackToken?: string
): AuthResponse => {
  const token = typeof data.token === "string" && data.token.trim() ? data.token : fallbackToken;
  if (!token) {
    throw new Error("Токен не получен.");
  }

  const expiresAt =
    typeof data.expiresAt === "number" && Number.isFinite(data.expiresAt)
      ? data.expiresAt
      : Date.now() + TOKEN_TTL_MS;

  return { token, expiresAt };
};

export const metrologyApi = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    if (!payload.username.trim() || !payload.password.trim()) {
      throw new Error("Введите логин и пароль.");
    }

    const response = await fetch(getApiUrl("/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: payload.username.trim(),
        password: payload.password
      })
    });

    if (!response.ok) {
      throw new Error("Ошибка авторизации.");
    }

    const data = (await response.json()) as { token?: unknown; expiresAt?: unknown };
    return normalizeAuthResponse(data);
  },

  async authorizeByToken(token: string): Promise<AuthResponse> {
    if (!token.trim()) {
      throw new Error("Токен отсутствует.");
    }

    const response = await fetch(getApiUrl("/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Ошибка авторизации по токену.");
    }

    const data = (await response.json()) as { token?: unknown; expiresAt?: unknown };
    return normalizeAuthResponse(data, token);
  },
// Login end
  async fetchParameters(mode: SearchMode, query: string): Promise<ParameterOption[]> {
    await delay(250);
    const normalized = query.trim().toLowerCase();

    return parameterByMode[mode].filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  },

  async fetchCriteria(parameterId: string): Promise<BackendCriterion[]> {
    await delay(900);
    return criteriaByParameter[parameterId] ?? [];
  },

  async searchDocuments(request: SearchRequest): Promise<SearchResponse> {
    await delay(700);

    if (request.criteria.length === 0) {
      return {
        text: "Не выбраны значения для поиска. Отметьте хотя бы одну величину и заполните значения.",
        documents: []
      };
    }

    const lines = request.criteria.map((item, index) => {
      if (item.value.mode === "single") {
        return `${index + 1}. ${item.name}: ${item.value.single} ${item.unit}`;
      }

      return `${index + 1}. ${item.name}: от ${item.value.from} до ${item.value.to} ${item.unit}`;
    });

    return {
      text: `Режим: ${request.mode}\nПараметр: ${request.parameterLabel}\n\nУсловия:\n${lines.join("\n")}`,
      documents: fallbackDocuments
    };
  },

  getDocumentPdfUrl(documentName: string): string {
    if (API_BASE_URL) {
      return `${API_BASE_URL.replace(/\/$/, "")}/documents/${encodeURIComponent(documentName)}/pdf`;
    }

    return `/documents/${encodeURIComponent(documentName)}.pdf`;
  },

  async submitRating(payload: RatingRequest): Promise<void> {
    await delay(450);
    void payload;
  }
};
