import type {
  BackendCriterion,
  FoundDocument,
  ParameterOption,
  RatingRequest,
  SearchMode,
  SearchRequest,
  SearchResponse
} from "../types";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

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

const samplePdfBase64 =
  "JVBERi0xLjQKJcOiw6MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMyAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDU5NSA4NDJdIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDQgMCBSID4+ID4+IC9Db250ZW50cyA1IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCjUgMCBvYmoKPDwgL0xlbmd0aCAxMDEgPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgo3MiA3NTAgVGQKKFByZXZpZXcgb2YgZG9jdW1lbnQpIFRqCi9GMSAxNCBUZgo3MiA3MjAgVGQKKFRoaXMgUERGIGlzIGxvYWRlZCBmcm9tIHRoZSBmcm9udGVuZCBtb2NrKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY0IDAwMDAwIG4gCjAwMDAwMDAxMjEgMDAwMDAgbiAKMDAwMDAwMDI0NyAwMDAwMCBuIAowMDAwMDAwMzE3IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNTA5CiUlRU9G";

const buildMockPdfBlob = (): Blob => {
  const binary = window.atob(samplePdfBase64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: "application/pdf" });
};

export const metrologyApi = {
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

  async fetchDocumentPdf(documentId: string): Promise<Blob> {
    if (API_BASE_URL) {
      const response = await fetch(
        `${API_BASE_URL.replace(/\/$/, "")}/documents/${encodeURIComponent(documentId)}/pdf`,
        {
          method: "GET"
        }
      );

      if (!response.ok) {
        throw new Error(`Не удалось загрузить PDF: ${response.status}`);
      }

      return await response.blob();
    }

    await delay(350);
    void documentId;
    return buildMockPdfBlob();
  },

  async submitRating(payload: RatingRequest): Promise<void> {
    await delay(450);
    void payload;
  }
};
