import { useState, useCallback } from "react";
import { axiosInstance, getBaseUrl } from "../constants";

export function useApi(checkAuth: () => Promise<boolean>) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUrl = useCallback(
    async (url: string) => {
      if (!url) return;
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const ok = await checkAuth();
        if (!ok) {
          setLoading(false);
          return;
        }

        // Update baseURL dynamically before each request to match current origin
        axiosInstance.defaults.baseURL = getBaseUrl();

        console.log(`Fetching: ${url} ...`);

        const res = await axiosInstance.get(url);
        setData(res.data);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [checkAuth]
  );

  console.log("data", data);
  return {
    data,
    error,
    loading,
    fetchUrl,
  };
}
