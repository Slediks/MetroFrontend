import { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownProps {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  value: DropdownOption | null;
  onChange: (option: DropdownOption) => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  emptyText?: string;
}

export const Dropdown = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  searchable = false,
  searchValue = "",
  onSearchChange,
  loading = false,
  disabled = false,
  emptyText = "Ничего не найдено"
}: DropdownProps): JSX.Element => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayText = useMemo(() => {
    if (searchable && open) {
      return searchValue;
    }

    return value?.label ?? "";
  }, [open, searchable, searchValue, value]);

  const showPlaceholder = !displayText;

  return (
    <div className={styles.field} ref={wrapperRef}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div
        className={`${styles.control} ${open ? styles.open : ""} ${disabled ? styles.disabled : ""}`}
      >
        <input
          id={inputId}
          className={styles.input}
          value={displayText}
          placeholder={placeholder}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          onChange={(event) => {
            if (!searchable || !onSearchChange) {
              return;
            }

            if (!open) {
              setOpen(true);
            }

            onSearchChange(event.target.value);
          }}
          readOnly={!searchable}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete={searchable ? "list" : "none"}
        />
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => {
            if (!disabled) {
              setOpen((prevState) => !prevState);
            }
          }}
          aria-label={open ? "Свернуть список" : "Раскрыть список"}
          disabled={disabled}
        >
          <span className={styles.icon} aria-hidden="true">
            ▾
          </span>
        </button>
        {showPlaceholder && <span className={styles.placeholder}>{placeholder}</span>}
      </div>

      {open && (
        <ul className={styles.menu} role="listbox" aria-label={label}>
          {loading ? <li className={styles.message}>Загрузка...</li> : null}
          {!loading && options.length === 0 ? <li className={styles.message}>{emptyText}</li> : null}
          {!loading
            ? options.map((option) => (
                <li key={option.id} className={styles.optionWrap}>
                  <button
                    type="button"
                    className={`${styles.option} ${value?.id === option.id ? styles.optionActive : ""}`}
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    role="option"
                    aria-selected={value?.id === option.id}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            : null}
        </ul>
      )}
    </div>
  );
};
