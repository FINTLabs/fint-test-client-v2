import { useState, useCallback } from "react";

const MAX_HISTORY_ITEMS = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = useCallback((uri: string) => {
    if (!uri || uri.trim() === "") return;
    
    setHistory((prev) => {
      // Remove if already exists and add to front
      const filtered = prev.filter((item) => item !== uri);
      // Add to front and limit to MAX_HISTORY_ITEMS
      return [uri, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
  };
}
