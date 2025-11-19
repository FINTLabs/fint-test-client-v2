// Simple localStorage wrapper for auth storage (similar to store2 in old app)
// Token expiration is handled by the server - we just store the token

type AuthData = {
  accessToken: string;
  userId: string;
};

const AUTH_KEY = "auth";

export function getAuth(): AuthData | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    
    const auth = JSON.parse(stored) as AuthData;
    return auth;
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthData): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch (error) {
    console.error("Failed to save auth to localStorage:", error);
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error("Failed to clear auth from localStorage:", error);
  }
}

export function hasAuth(): boolean {
  return getAuth() !== null;
}

