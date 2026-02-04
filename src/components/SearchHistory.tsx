import React from "react";

interface SearchHistoryProps {
  history: string[];
  onSelect: (uri: string) => void;
  onClear: () => void;
}

export function SearchHistory({ history, onSelect, onClear }: SearchHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "600" }}>Søkehistorikk</h3>
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "0.25rem 0.5rem",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Tøm historikk
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {history.map((uri, index) => (
          <button
            key={`${uri}-${index}`}
            onClick={() => onSelect(uri)}
            style={{
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: "4px",
              padding: "0.375rem 0.75rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              color: "#0066cc",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e8e8e8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f5f5f5";
            }}
          >
            {uri}
          </button>
        ))}
      </div>
    </div>
  );
}
