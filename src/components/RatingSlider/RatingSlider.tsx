import styles from "./RatingSlider.module.css";

interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export const RatingSlider = ({ value, onChange }: RatingSliderProps): JSX.Element => {
  const fillPercent = ((value - 1) / 4) * 100;

  return (
    <div className={styles.wrap}>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={styles.slider}
        style={{
          background: `linear-gradient(90deg, var(--primary-color) 0%, var(--primary-color) ${fillPercent}%, var(--border) ${fillPercent}%, var(--border) 100%)`
        }}
        aria-label="Оценка"
      />
      <div className={styles.scale}>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  );
};
