import { useEffect, useState } from "react";

export const useDebounce = <T,>(value: T, delay = 300): T => {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [value, delay]);

  return debounced;
};
