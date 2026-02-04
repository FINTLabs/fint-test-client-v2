import { Box, Page, CopyButton } from "@navikt/ds-react";
import { useAuth } from "./hooks/useAuth";
import { useApi } from "./hooks/useApi";
import { useUrl } from "./hooks/useUrl";
import { useSearchHistory } from "./hooks/useSearchHistory";
import { LoginPage } from "./components/LoginPage";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { UriForm } from "./components/UriForm";
import { DataDisplay } from "./components/DataDisplay";
import { SearchHistory } from "./components/SearchHistory";
import store from "store2";
import type { Auth } from "./utils/auth";
import { useMemo } from "react";

export default function App() {
  const { setAuth, setExpires, isExpired, checkAuth } = useAuth();
  const { data, error, loading, fetchUrl } = useApi(checkAuth);
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const { uri, setUri, handleSubmit, handleSelectFromHistory } = useUrl(fetchUrl, isExpired, addToHistory);

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

  if (isExpired) {
    return <LoginPage onLogin={handleLogin} onLogout={handleLogout} />;
  }

  return (
      <Page footer={<Footer />}>
      <Header onLogout={handleLogout} />
      <Page.Block as="main" width="xl" gutters>
        <Box padding="space-16">
          <UriForm uri={uri} onUriChange={setUri} onSubmit={handleSubmit} />
          <SearchHistory
            history={history}
            onSelect={handleSelectFromHistory}
            onClear={clearHistory}
          />
        </Box>

        {(data !== null || error !== null || loading) && (
            <><Box padding="space-4" >
              {jsonString && (
                  <div style={{marginBottom: "1rem", display: "flex", justifyContent: "flex-end"}}>
                    <CopyButton copyText={jsonString} text="Kopier JSON"/>
                  </div>
              )}
            </Box><Box background="surface-subtle" padding="space-16" borderWidth="2">
              <DataDisplay loading={loading} error={error} data={data} fetchUrl={fetchUrl} setUri={setUri} addToHistory={addToHistory}/>
            </Box></>
        )}
      </Page.Block>
    </Page>
  );
}
