import { useState, useEffect } from "react";
import { getInitialUri, updateUrl } from "../utils/url";

export function useUrl(fetchUrl: (url: string) => Promise<void>, isExpired: boolean) {
  const [uri, setUri] = useState<string>(() => getInitialUri());

  // Handle back/forward navigation
  useEffect(() => {
    const handler = () => {
      console.log("popstate " + window.location.search);
      if (window.location.search.length > 1) {
        // Get everything after ? without decoding
        const newUrl = window.location.search.substring(1);
        setUri(newUrl);
        fetchUrl(newUrl);
      } else {
        window.location.reload();
      }
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [fetchUrl]);

  // Initial fetch if there is a query param and we are not expired
  useEffect(() => {
    if (uri && !isExpired) {
      fetchUrl(uri);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uri) return;
    updateUrl(uri);
    fetchUrl(uri);
  };

  return {
    uri,
    setUri,
    handleSubmit,
  };
}
