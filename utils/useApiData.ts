// Custom hook for fetching API data with caching
import { useState, useEffect, useCallback } from "react";
import { dataCache } from "./cache";

interface UseApiDataOptions {
  url: string;
  refreshInterval?: number; // seconds
  cacheTTL?: number; // milliseconds
  enabled?: boolean;
}

interface UseApiDataResult {
  data: unknown;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApiData({
  url,
  refreshInterval = 60,
  cacheTTL = 60000, // 1 minute default
  enabled = true,
}: UseApiDataOptions): UseApiDataResult {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = dataCache.get(url);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      // Cache the response
      dataCache.set(url, json, cacheTTL);
      setData(json);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      console.error("API fetch error:", err);
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, enabled, cacheTTL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle refresh interval
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      // Clear cache before refetching to force fresh data
      dataCache.clear(url);
      fetchData();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [enabled, refreshInterval, url, fetchData]);

  const refetch = async () => {
    dataCache.clear(url);
    await fetchData();
  };

  return { data, loading, error, refetch };
}
