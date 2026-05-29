import { useState, useEffect } from 'react';

/**
 * 指定した時間（ミリ秒）だけ値の更新を遅延させるカスタムフック
 * @param value 遅延させたい値
 * @param delay 遅延時間（ミリ秒）
 * @returns 遅延後の値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
