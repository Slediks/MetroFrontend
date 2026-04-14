import type { RowDraft } from "../../types";
import { Toggle } from "../Toggle/Toggle";
import type { RowValidation } from "../../utils/validation";
import styles from "./DocumentRow.module.css";

interface DocumentRowProps {
  row: RowDraft;
  validation: RowValidation;
  onToggleSelected: (rowId: string, selected: boolean) => void;
  onUnitChange: (rowId: string, unit: string) => void;
  onValueSingleChange: (rowId: string, value: string) => void;
  onRangeChange: (rowId: string, side: "from" | "to", value: string) => void;
  onRangeModeChange: (rowId: string, rangeMode: boolean) => void;
}

export const DocumentRow = ({
  row,
  validation,
  onToggleSelected,
  onUnitChange,
  onValueSingleChange,
  onRangeChange,
  onRangeModeChange
}: DocumentRowProps): JSX.Element => {
  const unitDisabled = !row.selected || row.units.length < 2;
  const valueDisabled = !row.selected;

  return (
    <div className={styles.row}>
      <div className={`${styles.cell} ${styles.checkboxCell}`}>
        <label className={`${styles.checkbox} ${row.selected ? styles.checked : ""} ${row.required ? styles.required : ""}`}>
          <input
            type="checkbox"
            checked={row.selected}
            disabled={row.required}
            onChange={(event) => onToggleSelected(row.id, event.target.checked)}
            className={styles.hiddenInput}
            aria-label={`Выбрать ${row.name}`}
          />
          <span className={styles.mark}>✓</span>
        </label>
      </div>

      <div className={styles.cell}>
        <div className={styles.valueTitle}>
          <span className={styles.valueName}>{row.name}</span>
          <span className={styles.valueMeta}>{row.required ? "Обязательно" : "Необязательно"}</span>
        </div>
      </div>

      <div className={styles.cell}>
        {row.units.length === 1 ? (
          <span className={styles.singleUnit}>{row.units[0]}</span>
        ) : (
          <div className={`${styles.selectWrap} ${validation.unit ? styles.invalid : ""}`}>
            <select
              value={row.unit}
              onChange={(event) => onUnitChange(row.id, event.target.value)}
              disabled={unitDisabled}
              aria-invalid={Boolean(validation.unit)}
            >
              <option value="">Ед. измерения</option>
              {row.units.map((unit) => (
                <option value={unit} key={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.cell}>
        {!row.rangeMode ? (
          <div className={`${styles.inputWrap} ${validation.value ? styles.invalid : ""}`}>
            <input
              value={row.valueSingle}
              onChange={(event) => onValueSingleChange(row.id, event.target.value)}
              placeholder="Введите значение"
              disabled={valueDisabled}
              aria-invalid={Boolean(validation.value)}
            />
          </div>
        ) : (
          <div className={styles.rangeWrap}>
            <div className={`${styles.inputWrap} ${validation.value ? styles.invalid : ""}`}>
              <input
                value={row.valueFrom}
                onChange={(event) => onRangeChange(row.id, "from", event.target.value)}
                placeholder="От"
                disabled={valueDisabled}
                aria-invalid={Boolean(validation.value)}
              />
            </div>
            <span className={styles.dash}>—</span>
            <div className={`${styles.inputWrap} ${validation.value ? styles.invalid : ""}`}>
              <input
                value={row.valueTo}
                onChange={(event) => onRangeChange(row.id, "to", event.target.value)}
                placeholder="До"
                disabled={valueDisabled}
                aria-invalid={Boolean(validation.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.cell}>
        <Toggle
          checked={row.rangeMode}
          onChange={(checked) => onRangeModeChange(row.id, checked)}
          ariaLabel={`Переключить режим диапазона для ${row.name}`}
          disabled={!row.selected}
        />
      </div>
    </div>
  );
};
