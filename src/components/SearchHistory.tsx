import React from "react";
import { ActionMenu, Button } from "@navikt/ds-react";
import { ChevronDownIcon } from "@navikt/aksel-icons";

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
      <ActionMenu>
        <ActionMenu.Trigger>
          <Button variant="secondary" size="small" icon={<ChevronDownIcon aria-hidden />} iconPosition="right">
            {`Søkehistorikk (${history.length})`}
          </Button>
        </ActionMenu.Trigger>
        <ActionMenu.Content>
          {history.map((uri, index) => (
            <ActionMenu.Item key={`${uri}-${index}`} onSelect={() => onSelect(uri)}>
              {uri}
            </ActionMenu.Item>
          ))}
          <ActionMenu.Divider />
          <ActionMenu.Item onSelect={onClear} variant="danger">
            Tøm historikk
          </ActionMenu.Item>
        </ActionMenu.Content>
      </ActionMenu>
    </div>
  );
}
