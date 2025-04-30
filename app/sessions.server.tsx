import { createCookieSessionStorage } from "react-router";

type SessionData = {
  userId: string;
  accessToken: string;
};

type SessionFlashData = {
  error: string;
};

// TODO: Get the secret from environment variable
const SECRET =
  process.env.SESSION_SECRET || "this-should-be-a-secret-in-production";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__session",

      // Add secrets array for signing the cookie
      secrets: [SECRET],

      // Keep the other settings
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };
