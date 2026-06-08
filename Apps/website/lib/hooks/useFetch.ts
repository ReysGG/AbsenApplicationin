/**
 * lib/hooks/useFetch.ts
 *
 * Generic fetch hook untuk data fetching dengan loading/error state.
 * Menggantikan pattern duplikat di semua workspace pages.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useFetch(() =>
 *     api.get<MyType>("v1/something", params)
 *   )
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { ApiResponse } from "@/lib/apiClient";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchResult<T> extends UseFetchState<T> {
  refetch: () => void;
}

/**
 * Hook untuk fetch data sekali + refetch manual.
 *
 * @param fetcher  Fungsi yang mengembalikan Promise<ApiResponse<T>>
 * @param deps     Dependency array — refetch otomatis saat deps berubah
 */
export function useFetch<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  deps: unknown[] = []
): UseFetchResult<T> {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Stable ref untuk fetcher agar tidak trigger re-render loop
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetcherRef.current();
      if (res.success) {
        setState({ data: res.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: res.error.message ?? "Terjadi kesalahan." });
      }
    } catch {
      setState({ data: null, loading: false, error: "Terjadi kesalahan jaringan." });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, execute]);

  return { ...state, refetch: execute };
}

/**
 * Hook untuk fetch data dengan polling interval.
 *
 * @param fetcher        Fungsi fetch
 * @param intervalMs     Polling interval dalam ms (default 10000)
 * @param deps           Dependency array
 */
export function usePollingFetch<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  intervalMs = 10000,
  deps: unknown[] = []
): UseFetchResult<T> & { lastUpdated: Date | null } {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetcherRef.current();
      if (res.success) {
        setState({ data: res.data, loading: false, error: null });
        setLastUpdated(new Date());
      } else {
        setState((s) => ({ ...s, loading: false, error: res.error.message ?? "Terjadi kesalahan." }));
      }
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Terjadi kesalahan jaringan." }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
    const interval = setInterval(execute, intervalMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, execute, intervalMs]);

  return { ...state, lastUpdated, refetch: execute };
}
