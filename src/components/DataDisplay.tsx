import React, { useMemo } from "react";
import { getBaseUrl } from "../constants";

interface DataDisplayProps {
  loading: boolean;
  error: string | null;
  data: unknown;
  fetchUrl: (url: string) => Promise<void>;
}

function linkifyUrls(jsonString: string, fetchUrl: (url: string) => Promise<void>): (string | React.ReactElement)[] {

  const urlRegex = /(https?:\/\/[^\s"'<>,\]]+|\/[^\s"'<>,\]]+)/g;

  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = urlRegex.exec(jsonString)) !== null) {

    if (match.index > lastIndex) {
      parts.push(jsonString.substring(lastIndex, match.index));
    }

    const url = match[0];
    let path: string;
    try {
      const BASE_URL = getBaseUrl();
      if (url.startsWith("http://") || url.startsWith("https://")) {
        // Extract path by removing BASE_URL, matching old code: links[i].href.replace(BASE_URL, '')
        const fullUrl = url;
        if (fullUrl.startsWith(BASE_URL)) {
          path = fullUrl.replace(BASE_URL, "").toLowerCase();
        } else {
          // If URL is from different domain, extract pathname + search + hash
          const urlObj = new URL(fullUrl);
          path = (urlObj.pathname + urlObj.search + urlObj.hash).toLowerCase();
        }
      } else {
        path = url.toLowerCase();
      }
      
      const href = `${window.location.origin}?${path}`;

      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={href}
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, "", href);
            fetchUrl(path);
          }}
          style={{ color: "#0066cc", textDecoration: "underline", cursor: "pointer" }}
        >
          {url}
        </a>
      );
    } catch {
      parts.push(url);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < jsonString.length) {
    parts.push(jsonString.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [jsonString];
}


export function DataDisplay({ loading, error, data, fetchUrl }: DataDisplayProps) {
  const jsonString = useMemo(() => {
    if (data === null) return null;
    return JSON.stringify(data, null, 2);
  }, [data]);

  const jsonContent = useMemo(() => {
    if (!jsonString) return null;
    return linkifyUrls(jsonString, fetchUrl);
  }, [jsonString, fetchUrl]);

  return (
    <section style={{ marginTop: "1rem" }}>
      {loading && <div>Loading…</div>}
      {error && <pre className="error">{error}</pre>}
      {data !== null && jsonContent && (
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{jsonContent}</pre>
      )}
    </section>
  );
}
