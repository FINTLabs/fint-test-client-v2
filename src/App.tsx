import { Page } from '@navikt/ds-react';
import { useAuth } from './hooks/useAuth';
import { useApi } from './hooks/useApi';
import { useUrl } from './hooks/useUrl';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UriForm } from './components/UriForm';
import { DataDisplay } from './components/DataDisplay';
import store from 'store2';
import type { Auth } from './utils/auth';

export default function App() {
    const { auth, setAuth, expires, setExpires, isExpired, checkAuth } = useAuth();
    const { data, error, loading, fetchUrl } = useApi(checkAuth);
    const { uri, setUri, handleSubmit } = useUrl(fetchUrl, isExpired);

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
                <UriForm uri={uri} onUriChange={setUri} onSubmit={handleSubmit} />
                <DataDisplay loading={loading} error={error} data={data} />
            </Page.Block>
        </Page>
    );
}
