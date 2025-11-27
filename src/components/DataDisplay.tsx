import React, { useMemo } from "react";

interface DataDisplayProps {
  loading: boolean;
  error: string | null;
  data: unknown;
}


// Function to safely convert URLs in JSON string to clickable links
// React automatically escapes text content, so we don't need manual HTML escaping
function linkifyUrls(jsonString: string): (string | React.ReactElement)[] {
  // Match URLs (http://, https://, or relative URLs starting with /)
  // More precise regex to avoid matching inside other JSON values
  const urlRegex = /(https?:\/\/[^\s"'<>,\]}]+|\/[^\s"'<>,\]}]+)/g;

  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = urlRegex.exec(jsonString)) !== null) {
    // Add text before the URL (React will escape it automatically)
    if (match.index > lastIndex) {
      parts.push(jsonString.substring(lastIndex, match.index));
    }

    // Create safe link
    const url = match[0];
    let href: string;
    try {
      href = url.startsWith("http") ? url : `${window.location.origin}${url}`;

      // Validate URL to prevent javascript: or data: schemes
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
        // If invalid protocol, just show as text (React escapes automatically)
        parts.push(url);
      }
    } catch {
      // If URL parsing fails, show as text (React escapes automatically)
      parts.push(url);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text (React escapes automatically)
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
