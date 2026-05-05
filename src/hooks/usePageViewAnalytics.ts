import { useEffect, useRef } from "react";
import { sendPageView } from "../services/analyticsService";

function getCurrentPath(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function usePageViewAnalytics() {
  const lastPathRef = useRef<string>("");

  console.log("usePageViewAnalytics()");
  useEffect(() => {
    const trackCurrentPath = () => {
      const path = getCurrentPath();

      if (path === lastPathRef.current) {
        return;
      }

      lastPathRef.current = path;
      sendPageView(path);
    };

    const wrapHistoryMethod = <T extends (...args: any[]) => any>(method: T): T => {
      return ((...args: Parameters<T>) => {
        const result = method.apply(window.history, args);
        trackCurrentPath();
        return result;
      }) as T;
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = wrapHistoryMethod(originalPushState);
    window.history.replaceState = wrapHistoryMethod(originalReplaceState);

    window.addEventListener("popstate", trackCurrentPath);
    window.addEventListener("hashchange", trackCurrentPath);

    trackCurrentPath();

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", trackCurrentPath);
      window.removeEventListener("hashchange", trackCurrentPath);
    };
  }, []);
}
