import React, { useMemo } from "react";

interface DataDisplayProps {
  loading: boolean;
  error: string | null;
  data: unknown;
}


function linkifyUrls(jsonString: string): (string | React.ReactElement)[] {

  const urlRegex = /(https?:\/\/[^\s"'<>,\]}]+|\/[^\s"'<>,\]}]+)/g;

  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = urlRegex.exec(jsonString)) !== null) {

    if (match.index > lastIndex) {
      parts.push(jsonString.substring(lastIndex, match.index));
    }

    const url = match[0];
    let href: string;
    try {
      let path: string;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        const urlObj = new URL(url);
        path = urlObj.pathname;
      } else {
        path = url;
      }
      
      href = `${window.location.origin}?${path}`;

      const urlObj = new URL(href, window.location.origin);
      if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
        parts.push(
          <a
            key={`link-${keyCounter++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            {url}
          </a>
        );
      } else {
        parts.push(url);
      }
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


export function DataDisplay({ loading, error, data }: DataDisplayProps) {
  const jsonString = useMemo(() => {
    if (data === null) return null;
    return JSON.stringify(data, null, 2);
  }, [data]);

  const jsonContent = useMemo(() => {
    if (!jsonString) return null;
    return linkifyUrls(jsonString);
  }, [jsonString]);

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
