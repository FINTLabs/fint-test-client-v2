import { useState } from "react";
import { Page } from "@navikt/ds-react";
import { LoginFormWithJsonPrefill } from "../LoginFormWithJsonPrefill";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { login } from "../services/authService";
import type { Auth } from "../utils/auth";
import store from "store2";

interface LoginPageProps {
  onLogin: (auth: Auth) => void;
  onLogout: () => void;
}

export function LoginPage({ onLogin, onLogout }: LoginPageProps) {
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (formData: FormData) => {
    setLoginError(null);
    setLoginLoading(true);

    try {
      const clientId = formData.get("clientId") as string;
      const clientSecret = formData.get("openIdSecret") as string;
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;

      const auth = await login(clientId, clientSecret, username, password);

      store("auth", auth);
      onLogin(auth);
    } catch (err: any) {
      console.error(err);
      setLoginError(err?.message ?? "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <Page footer={<Footer />}>
      <Header onLogout={onLogout} />
      <Page.Block as="main" width="xl" gutters>
        <LoginFormWithJsonPrefill isLoading={loginLoading} onSubmit={handleLogin} />
        {loginError && <div className="error">{loginError}</div>}
      </Page.Block>
    </Page>
  );
}
