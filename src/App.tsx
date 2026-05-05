import { Box, CopyButton, Page } from "@navikt/ds-react";
import { useAuth } from "./hooks/useAuth";
import { useApi } from "./hooks/useApi";
import { useUrl } from "./hooks/useUrl";
import { useSearchHistory } from "./hooks/useSearchHistory";
import { LoginPage } from "./components/LoginPage";
import { Footer } from "./components/Footer";
import { UriForm } from "./components/UriForm";
import { DataDisplay } from "./components/DataDisplay";
import store from "store2";
import type { Auth } from "./utils/auth";
import { useEffect, useMemo } from "react";
import { NovariHeader } from "novari-frontend-components";
import { TrashIcon } from "@navikt/aksel-icons";

export default function App() {
  useEffect(() => {
    fetch("/analytics/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app: "fint-test-client-v2",
        event: "page_view",
        path: window.location.pathname,
      }),
    });
  }, []);

  const { setAuth, setExpires, isExpired, checkAuth } = useAuth();
  const { data, error, loading, fetchUrl } = useApi(checkAuth);
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const { uri, setUri, handleSubmit, handleSelectFromHistory } = useUrl(
    fetchUrl,
    isExpired,
    addToHistory
  );

  const jsonString = useMemo(() => {
    if (data === null) return null;
    return JSON.stringify(data, null, 2);
  }, [data]);

  const handleLogout = () => {
    store.clear();
    window.location.reload();
  };

  const handleLogin = (newAuth: Auth) => {
    setAuth(newAuth);
    setExpires(Date.parse(newAuth.expires));
  };

  const username = store("username") ?? "NO USERNAME FOUND";

  const historyMenu = useMemo(() => {
    if (history.length === 0) {
      return [];
    }

    return [
      {
        action: "history-menu",
        label: `URI Historikk (${history.length})`,
        description: "Tidligere URI",
        displayBox: false,
        submenu: [
          {
            action: "clear-history",
            label: "Tøm historikk",
            icon: <TrashIcon aria-hidden />,
          },
          ...history.map((uri) => ({
            action: uri,
            label: uri,
          })),
        ],
      },
    ];
  }, [history]);

  if (isExpired) {
    return <LoginPage onLogin={handleLogin} onLogout={handleLogout} />;
  }

  return (
    <Page footer={<Footer />}>
      <NovariHeader
        appName="FINT Test Client"
        showLogoWithTitle={true}
        menu={historyMenu}
        isLoggedIn={true}
        displayName={username}
        onLogout={handleLogout}
        onLogin={() => {}}
        onMenuClick={(action: string) => {
          if (action === "clear-history") {
            clearHistory();
          } else if (action && action !== "history-menu" && history.includes(action)) {
            handleSelectFromHistory(action);
          }
        }}
      ></NovariHeader>
      <Page.Block as="main" width="xl" gutters>
        <Box padding="space-16">
          <UriForm uri={uri} onUriChange={setUri} onSubmit={handleSubmit} />
        </Box>

        {(data !== null || error !== null || loading) && (
          <>
            <Box padding="space-4">
              {jsonString && (
                <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
                  <CopyButton copyText={jsonString} text="Kopier JSON" />
                </div>
              )}
            </Box>
            <Box background="surface-subtle" padding="space-16" borderWidth="2">
              <DataDisplay
                loading={loading}
                error={error}
                data={data}
                fetchUrl={fetchUrl}
                setUri={setUri}
                addToHistory={addToHistory}
              />
            </Box>
          </>
        )}
      </Page.Block>
    </Page>
  );
}
