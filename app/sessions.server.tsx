import { createCookieSessionStorage } from "react-router";

type SessionData = {
  userId: string;
  accessToken: string;
};

type SessionFlashData = {
  error: string;
};

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is not set in environment variables. Refusing to start."
  );
}

const SECRET = process.env.SESSION_SECRET;

// Determine if we should use secure cookies
// When behind Traefik/load balancer, the app sees HTTP but browser uses HTTPS
// So we need secure cookies. Default to true for production deployments.
// Allow override via FORCE_SECURE_COOKIES env var
const forceSecureCookies = process.env.FORCE_SECURE_COOKIES === "true";
const forceInsecureCookies = process.env.FORCE_SECURE_COOKIES === "false";
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";
// Default to secure cookies unless in development mode
// When behind HTTPS-terminating proxy, browser uses HTTPS so cookies must be secure
const useSecureCookies = forceInsecureCookies 
  ? false 
  : forceSecureCookies 
    ? true 
    : !isDevelopment; // Secure by default unless explicitly in development

console.log(`[${new Date().toISOString()}] DEBUG - Session config:`, {
  nodeEnv: process.env.NODE_ENV,
  isProduction,
  forceSecureCookies,
  forceInsecureCookies,
  secureCookie: useSecureCookies,
  hasSessionSecret: !!SECRET,
});

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__session",
      secrets: [SECRET],
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
      secure: useSecureCookies,
    },
  });

export { getSession, commitSession, destroySession };
