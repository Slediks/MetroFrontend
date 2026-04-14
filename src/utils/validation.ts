import type { RowDraft } from "../types";

export interface RowValidation {
  unit: string | null;
  value: string | null;
}

export const validateRow = (row: RowDraft): RowValidation => {
  if (!row.selected) {
    return { unit: null, value: null };
  }

  const unitError = row.unit.trim() ? null : "Выберите единицу измерения";

  if (row.rangeMode) {
    const fromValue = row.valueFrom.trim();
    const toValue = row.valueTo.trim();

    if (!fromValue || !toValue) {
      return { unit: unitError, value: "Заполните обе границы диапазона" };
    }

    return { unit: unitError, value: null };
  }

  const singleValueError = row.valueSingle.trim() ? null : "Введите значение";
  return { unit: unitError, value: singleValueError };
};

export const hasRowErrors = (validation: RowValidation): boolean =>
  Boolean(validation.unit || validation.value);
