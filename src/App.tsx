import { useEffect, useMemo, useState } from "react";
import { metrologyApi } from "./api/metrologyApi";
import { DocumentTable } from "./components/DocumentTable/DocumentTable";
import { Dropdown, type DropdownOption } from "./components/Dropdown/Dropdown";
import { RatingSlider } from "./components/RatingSlider/RatingSlider";
import { useDebounce } from "./hooks/useDebounce";
import type { BackendCriterion, RowDraft, SearchMode } from "./types";
import { hasRowErrors, validateRow, type RowValidation } from "./utils/validation";
import styles from "./App.module.css";

const THEME_STORAGE_KEY = "metrology_theme";

const modeOptions: DropdownOption[] = [
  { id: "Измеряет", label: "Измеряет" },
  { id: "Выдает", label: "Выдает" }
];

const toRowDraft = (criterion: BackendCriterion): RowDraft => ({
  id: criterion.id,
  required: criterion.required,
  name: criterion.name,
  units: criterion.units,
  selected: criterion.required,
  unit: criterion.units.length === 1 ? criterion.units[0] : "",
  rangeMode: false,
  valueSingle: "",
  valueFrom: "",
  valueTo: ""
});

const initialValidation = (rows: RowDraft[]): Record<string, RowValidation> =>
  rows.reduce<Record<string, RowValidation>>((accumulator, row) => {
    accumulator[row.id] = { unit: null, value: null };
    return accumulator;
  }, {});

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const App = (): JSX.Element => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mode, setMode] = useState<SearchMode>("Измеряет");
  const [parameterSearch, setParameterSearch] = useState("");
  const [parameterOptions, setParameterOptions] = useState<DropdownOption[]>([]);
  const [parameterLoading, setParameterLoading] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<DropdownOption | null>(null);

  const [tableLoading, setTableLoading] = useState(false);
  const [rows, setRows] = useState<RowDraft[]>([]);
  const [validations, setValidations] = useState<Record<string, RowValidation>>({});

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState("");

  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [ratingSending, setRatingSending] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");

  const debouncedSearch = useDebounce(parameterSearch, 300);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    const loadParameters = async (): Promise<void> => {
      setParameterLoading(true);
      try {
        const response = await metrologyApi.fetchParameters(mode, debouncedSearch);
        if (active) {
          setParameterOptions(response);
        }
      } catch (error) {
        if (active) {
          setParameterOptions([]);
          setSearchResult(getErrorMessage(error, "Не удалось загрузить параметры поиска."));
        }
      } finally {
        if (active) {
          setParameterLoading(false);
        }
      }
    };

    loadParameters();

    return () => {
      active = false;
    };
  }, [mode, debouncedSearch]);

  useEffect(() => {
    let active = true;

    if (!selectedParameter) {
      setRows([]);
      setValidations({});
      return;
    }

    const loadRows = async (): Promise<void> => {
      setTableLoading(true);
      try {
        const response = await metrologyApi.fetchCriteria(selectedParameter.id);
        if (!active) {
          return;
        }

        const nextRows = response.map(toRowDraft);
        setRows(nextRows);
        setValidations(initialValidation(nextRows));
      } catch (error) {
        if (active) {
          setRows([]);
          setValidations({});
          setSearchResult(getErrorMessage(error, "Не удалось загрузить величины для выбранного параметра."));
        }
      } finally {
        if (active) {
          setTableLoading(false);
        }
      }
    };

    loadRows();

    return () => {
      active = false;
    };
  }, [selectedParameter]);

  const selectedModeOption = useMemo<DropdownOption>(
    () => modeOptions.find((item) => item.id === mode) ?? modeOptions[0],
    [mode]
  );

  const updateRow = (rowId: string, updater: (row: RowDraft) => RowDraft): void => {
    setRows((prevState) => prevState.map((row) => (row.id === rowId ? updater(row) : row)));
    setValidations((prevState) => ({
      ...prevState,
      [rowId]: { unit: null, value: null }
    }));
  };

  const handleSearch = async (): Promise<void> => {
    if (!selectedParameter) {
      setSearchResult("Сначала выберите параметр поиска.");
      return;
    }

    const nextValidations: Record<string, RowValidation> = {};
    rows.forEach((row) => {
      nextValidations[row.id] = validateRow(row);
    });

    setValidations(nextValidations);

    const selectedRows = rows.filter((row) => row.selected);
    const invalidSelectedRows = selectedRows.filter((row) => hasRowErrors(nextValidations[row.id]));

    if (invalidSelectedRows.length > 0) {
      setSearchResult("Заполните обязательные поля для выбранных строк и повторите поиск.");
      return;
    }

    setSearchLoading(true);

    try {
      setRating(3);
      setComment("");
      setRatingMessage("");

      const payload = {
        mode,
        parameterId: selectedParameter.id,
        parameterLabel: selectedParameter.label,
        criteria: selectedRows.map((row) => ({
          id: row.id,
          name: row.name,
          unit: row.unit,
          value: row.rangeMode
            ? {
                mode: "range" as const,
                from: row.valueFrom.trim(),
                to: row.valueTo.trim()
              }
            : {
                mode: "single" as const,
                single: row.valueSingle.trim()
              }
        }))
      };

      const response = await metrologyApi.searchDocuments(payload);
      setSearchResult(response.text);
    } catch (error) {
      setSearchResult(getErrorMessage(error, "Не удалось выполнить поиск документов."));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRating = async (): Promise<void> => {
    setRatingSending(true);
    setRatingMessage("");

    try {
      await metrologyApi.submitRating({
        rating,
        comment: comment.trim(),
        mode,
        parameterId: selectedParameter?.id ?? null
      });

      setRatingMessage("Оценка отправлена.");
    } catch (error) {
      setRatingMessage(getErrorMessage(error, "Не удалось отправить оценку."));
    } finally {
      setRatingSending(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Поиск метрологических документов по параметрам</h1>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={() => setTheme((prevState) => (prevState === "light" ? "dark" : "light"))}
          aria-label="Переключить тему"
        >
          {theme === "light" ? "◑" : "◐"}
        </button>
      </header>

      <section className={styles.card}>
        <div className={styles.filterGrid}>
          <Dropdown
            label="Режим поиска"
            placeholder="Режим"
            options={modeOptions}
            value={selectedModeOption}
            onChange={(option) => {
              setMode(option.id as SearchMode);
              setParameterSearch("");
              setSelectedParameter(null);
              setSearchResult("");
              setRows([]);
            }}
          />

          <Dropdown
            label="Параметр"
            placeholder="Параметр"
            options={parameterOptions}
            value={selectedParameter}
            onChange={(option) => {
              setSelectedParameter(option);
              setParameterSearch(option.label);
              setSearchResult("");
            }}
            searchable
            searchValue={parameterSearch}
            onSearchChange={(value) => {
              setParameterSearch(value);
              setSelectedParameter(null);
            }}
            loading={parameterLoading}
            emptyText="Параметры не найдены"
          />
        </div>
      </section>

      <p className={styles.helper}>Выберите величины и их значения для поиска</p>

      <DocumentTable
        rows={rows}
        loading={tableLoading}
        parameterSelected={Boolean(selectedParameter)}
        validations={validations}
        onToggleSelected={(rowId, selected) =>
          updateRow(rowId, (row) => ({
            ...row,
            selected,
            unit: row.units.length === 1 ? row.units[0] : row.unit
          }))
        }
        onUnitChange={(rowId, unit) =>
          updateRow(rowId, (row) => ({
            ...row,
            unit
          }))
        }
        onValueSingleChange={(rowId, value) =>
          updateRow(rowId, (row) => ({
            ...row,
            valueSingle: value
          }))
        }
        onRangeChange={(rowId, side, value) =>
          updateRow(rowId, (row) => ({
            ...row,
            valueFrom: side === "from" ? value : row.valueFrom,
            valueTo: side === "to" ? value : row.valueTo
          }))
        }
        onRangeModeChange={(rowId, rangeMode) =>
          updateRow(rowId, (row) => ({
            ...row,
            rangeMode,
            valueSingle: rangeMode ? "" : row.valueSingle,
            valueFrom: rangeMode ? row.valueFrom : "",
            valueTo: rangeMode ? row.valueTo : ""
          }))
        }
      />

      <section className={styles.resultSection}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Результат</h2>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSearch}
            disabled={searchLoading || tableLoading}
          >
            {searchLoading ? "Поиск..." : "Поиск"}
          </button>
        </div>

        <div className={`${styles.card} ${styles.resultBox}`}>
          {searchResult ? (
            <p className={styles.resultText}>{searchResult}</p>
          ) : (
            <p className={styles.resultPlaceholder}>Результат поиска появится здесь после отправки запроса.</p>
          )}
        </div>
      </section>

      <section className={`${styles.card} ${styles.feedbackCard}`}>
        <h2 className={styles.sectionTitle}>Оценка</h2>
        <RatingSlider value={rating} onChange={setRating} />

        <label className={styles.commentLabel} htmlFor="feedback-comment">
          Комментарий
        </label>
        <div className={styles.textareaWrap}>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Оставьте комментарий к качеству результата"
          />
        </div>

        <div className={styles.feedbackActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleSendRating}
            disabled={ratingSending}
          >
            {ratingSending ? "Отправка..." : "Отправить оценку"}
          </button>
          {ratingMessage ? <span className={styles.feedbackMessage}>{ratingMessage}</span> : null}
        </div>
      </section>
    </main>
  );
};

export default App;
