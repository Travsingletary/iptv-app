import { useCallback, useEffect, useRef, useState } from 'react';
import { logError } from '../utils/errorLogger';

export interface AsyncRetryState<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  retry: () => void;
  attempt: number;
}

export interface AsyncRetryOptions {
  /** number of retries before giving up (default 3) */
  retries?: number;
  /** initial delay in ms (default 1000) */
  delay?: number;
  /** multiplier for exponential backoff (default 2) */
  factor?: number;
  /** context name for logging */
  context?: string;
}

export function useAsyncRetry<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  options: AsyncRetryOptions = {}
): AsyncRetryState<T> {
  const { retries = 3, delay = 1000, factor = 2, context } = options;
  const attemptRef = useRef(0);
  const [state, setState] = useState<AsyncRetryState<T>>({
    data: null,
    error: null,
    loading: true,
    retry: () => {},
    attempt: 0,
  });

  const execute = useCallback(() => {
    attemptRef.current += 1;
    const attempt = attemptRef.current;

    setState(prev => ({ ...prev, loading: true, error: null, attempt }));

    fn()
      .then((result) => {
        setState({ data: result, error: null, loading: false, retry: execute, attempt });
      })
      .catch((err) => {
        logError(err, { context });

        if (attempt < retries) {
          const backoff = delay * Math.pow(factor, attempt - 1);
          setTimeout(() => execute(), backoff);
        } else {
          setState({ data: null, error: err, loading: false, retry: execute, attempt });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, retries, delay, factor, context]);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}