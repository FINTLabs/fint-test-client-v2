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
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = urlRegex.exec(jsonString)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(jsonString.substring(lastIndex, match.index));
    }

    const url = match[0];

    try {

      const originalUrlObj = url.startsWith("http")
          ? new URL(url)
          : new URL(url, window.location.origin);

      if (
          originalUrlObj.protocol === "http:" ||
          originalUrlObj.protocol === "https:"
      ) {
        // Rewrite it into your legacy "viewer" format
        const href = `${window.location.origin}?${url}`;

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
      // If URL fails to parse, show plain text
      parts.push(url);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last URL
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
