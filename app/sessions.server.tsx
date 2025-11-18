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

const isProduction = process.env.NODE_ENV === "production";
console.log(`[${new Date().toISOString()}] DEBUG - Session config:`, {
  nodeEnv: process.env.NODE_ENV,
  isProduction,
  secureCookie: isProduction,
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
      secure: isProduction,
    },
  });

export { getSession, commitSession, destroySession };
