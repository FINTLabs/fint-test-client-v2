import store from "store2";

export type Auth = {
  accessToken: string;
  expires: string;
};

export function isAuthExpired(auth: Auth | null, expires: number, playWithFint: boolean): boolean {
  if (playWithFint) {
    // mimic original script: short-lived fake session
    return false;
  }
  if (!auth) return true;
  return Date.now() > expires;
}

export async function ensureLoggedIn(
  auth: Auth | null,
  expires: number,
  playWithFint: boolean,
  setAuth: (auth: Auth | null) => void,
  setExpires: (expires: number) => void
): Promise<boolean> {
  if (playWithFint) {
    // fake expiry in the future, as original did
    if (!expires) {
      const future = Date.now() + 100_000;
      setExpires(future);
    }
    return true;
  }

  const saved = store("auth") as Auth | null;
  if (!saved) return false;

  if (Date.now() > Date.parse(saved.expires)) {
    store.remove("auth");
    setAuth(null);
    return false;
  }

  setAuth(saved);
  setExpires(Date.parse(saved.expires));
  return true;
}

export function getPlayWithFint(baseUrl: string): boolean {
  return baseUrl.includes("//play-with-fint.");
}
