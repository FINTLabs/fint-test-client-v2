import { useState, useEffect, useMemo, useCallback } from "react";
import store from "store2";
import type { Auth } from "../utils/auth";
import { axiosInstance, getBaseUrl } from "../constants";
import { isAuthExpired, getPlayWithFint, ensureLoggedIn } from "../utils/auth";

export function useAuth() {
  const [auth, setAuth] = useState<Auth | null>(() => store("auth") ?? null);
  const [expires, setExpires] = useState<number>(() => (auth ? Date.parse(auth.expires) : 0));

  const playWithFint = useMemo(() => getPlayWithFint(getBaseUrl()), []);

  // Keep axios auth header in sync
  useEffect(() => {
    if (auth) {
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${auth.accessToken}`;
    } else {
      delete axiosInstance.defaults.headers.common["Authorization"];
    }
  }, [auth]);

  const isExpired = useMemo(() => {
    return isAuthExpired(auth, expires, playWithFint);
  }, [auth, expires, playWithFint]);

  const checkAuth = useCallback(
    async () => ensureLoggedIn(auth, expires, playWithFint, setAuth, setExpires),
    [auth, expires, playWithFint]
  );

  return {
    auth,
    setAuth,
    expires,
    setExpires,
    isExpired,
    checkAuth,
  };
}
