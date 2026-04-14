import { DocumentRow } from "../DocumentRow/DocumentRow";
import type { RowDraft } from "../../types";
import type { RowValidation } from "../../utils/validation";
import styles from "./DocumentTable.module.css";

interface DocumentTableProps {
  rows: RowDraft[];
  loading: boolean;
  parameterSelected: boolean;
  validations: Record<string, RowValidation>;
  onToggleSelected: (rowId: string, selected: boolean) => void;
  onUnitChange: (rowId: string, unit: string) => void;
  onValueSingleChange: (rowId: string, value: string) => void;
  onRangeChange: (rowId: string, side: "from" | "to", value: string) => void;
  onRangeModeChange: (rowId: string, rangeMode: boolean) => void;
}

export const DocumentTable = ({
  rows,
  loading,
  parameterSelected,
  validations,
  onToggleSelected,
  onUnitChange,
  onValueSingleChange,
  onRangeChange,
  onRangeModeChange
}: DocumentTableProps): JSX.Element => {
  const showEmpty = !parameterSelected;
  const showNoRows = parameterSelected && !loading && rows.length === 0;
  const showBody = parameterSelected && !loading && rows.length > 0;

  return (
    <section className={styles.tableCard}>
      <div className={styles.tableHead}>
        <div className={styles.th}>Статус</div>
        <div className={styles.th}>Физическая величина</div>
        <div className={styles.th}>Ед. измерения</div>
        <div className={styles.th}>Значение</div>
        <div className={styles.th}>Диапазон</div>
      </div>

      {showEmpty ? (
        <div className={styles.stateBox}>
          <div className={styles.stateLogo}>МД</div>
          <h3 className={styles.stateTitle}>Параметр пока не выбран</h3>
          <p className={styles.stateText}>
            Выберите параметр для отображения доступных величин, единиц измерения и полей значений.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className={styles.stateBox}>
          <div className={styles.loader} aria-hidden="true" />
          <h3 className={styles.stateTitle}>Загружаем доступные величины</h3>
          <p className={styles.stateText}>Подготавливаем список величин и единиц измерения.</p>
        </div>
      ) : null}

      {showNoRows ? (
        <div className={styles.stateBox}>
          <h3 className={styles.stateTitle}>По выбранному параметру нет данных</h3>
          <p className={styles.stateText}>Попробуйте другой параметр или режим поиска.</p>
        </div>
      ) : null}

      {showBody ? (
        <div className={styles.tableBody}>
          {rows.map((row) => (
            <DocumentRow
              key={row.id}
              row={row}
              validation={validations[row.id] ?? { unit: null, value: null }}
              onToggleSelected={onToggleSelected}
              onUnitChange={onUnitChange}
              onValueSingleChange={onValueSingleChange}
              onRangeChange={onRangeChange}
              onRangeModeChange={onRangeModeChange}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};
