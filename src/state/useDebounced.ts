import { useEffect, useState } from 'react';

/** Returns a debounced copy of `value` that only updates after `delay` ms of quiet.
 *  Used to keep typing/slider drags from thrashing the QR engine + compositor. */
export function useDebounced<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
