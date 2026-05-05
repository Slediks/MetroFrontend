export type SearchMode = "Измеряет" | "Выдает";

export interface ParameterOption {
  id: string;
  label: string;
}

export interface BackendCriterion {
  id: string;
  required: boolean;
  name: string;
  units: string[];
}

export interface RowDraft {
  id: string;
  required: boolean;
  name: string;
  units: string[];
  selected: boolean;
  unit: string;
  rangeMode: boolean;
  valueSingle: string;
  valueFrom: string;
  valueTo: string;
}

export interface SearchCriterionPayload {
  id: string;
  name: string;
  unit: string;
  value: {
    mode: "single" | "range";
    single?: string;
    from?: string;
    to?: string;
  };
}

export interface SearchRequest {
  mode: SearchMode;
  parameterId: string;
  parameterLabel: string;
  criteria: SearchCriterionPayload[];
}

export interface FoundDocument {
  id: string;
  fileName: string;
}

export interface SearchResponse {
  text: string;
  documents: FoundDocument[];
}

export interface RatingRequest {
  rating: number;
  comment: string;
  mode: SearchMode;
  parameterId: string | null;
}
// Login
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: number;
}
