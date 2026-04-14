import styles from "./Toggle.module.css";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}

export const Toggle = ({ checked, onChange, ariaLabel, disabled = false }: ToggleProps): JSX.Element => {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${checked ? styles.active : ""}`}
      onClick={() => onChange(!checked)}
      aria-label={ariaLabel}
      aria-pressed={checked}
      disabled={disabled}
    />
  );
};
