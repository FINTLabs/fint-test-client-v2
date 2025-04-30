import { Alert } from "@navikt/ds-react";
import { LoginFormWithJsonPrefill } from "~/components/LoginForm";

import {
  type LoaderFunction,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
} from "react-router";
import { UriForm } from "~/components/UriForm";
import ClientOAuth2 from "client-oauth2";
import { commitSession, getSession } from "~/sessions.server";
import { useEffect, useState } from "react";

type LoaderData = {
  loggedIn: boolean;
  uri?: string;
  hasError?: string;
  uriData?: any;
};

type ActionData = {
  error?: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  let loggedIn = false;
  const session = await getSession(request.headers.get("Cookie"));
  let uriData = null;
  let hasError = null;

  const url = new URL(request.url);
  let uri = url.search.slice(1).trim();
  if (uri.endsWith("=")) {
    uri = uri.slice(0, -1);
  }
  if (uri.startsWith("%2F")) {
    uri = decodeURIComponent(uri);
  }

  if (session.has("userId")) {
    loggedIn = true;
  }

  if (loggedIn && uri) {
    if (!uri.startsWith("/") || uri.includes("..") || uri.includes("://")) {
      hasError = "Ugyldig URI";
    } else {
      const baseUrl = new URL(request.url).origin;

      console.log(`[${new Date().toISOString()}] Starting URI:`, baseUrl + uri);

      const url = new URL(request.url);
      url.search = `?${uri.trim()}`;

      //TODO: Fix this so it is not always api
      const apiUrl = `https://api.felleskomponent.no${uri}`;
      const session = await getSession(request.headers.get("Cookie"));

      try {
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${session.get("accessToken")}`,
            "x-client": "fint-test-client",
            Accept: "application/json",
          },
        });
        uriData = await response.json();
      } catch (error) {
        console.log(`[${new Date().toISOString()}] API Error:`, error);
        hasError = "Error fetching data from the API";
      }
    }
  }
  return { loggedIn, uri, hasError, uriData };
};

export async function action({ request }: { request: Request }) {
  console.log(`[${new Date().toISOString()}] Starting log in`);

  const formData = await request.formData();
  const clientId = formData.get("clientId")?.toString();
  const clientSecret = formData.get("openIdSecret")?.toString();
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  if (!clientId || !clientSecret || !username || !password) {
    return {
      error: "All fields are required",
    };
  }

  try {
    const auth = new ClientOAuth2({
      clientId,
      clientSecret,
      accessTokenUri: "https://idp.felleskomponent.no/nidp/oauth/nam/token",
      scopes: ["fint-client"],
    });

    const user = await auth.owner.getToken(username, password);

    if (!user) {
      console.log(`[${new Date().toISOString()}] Error with login`);
      return {
        error: "Authentication failed. Please check your credentials.",
      };
    }
    const session = await getSession(request.headers.get("Cookie"));
    session.set("userId", username);
    session.set("accessToken", user.accessToken);

    console.log(`[${new Date().toISOString()}] Login completed`);

    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Credentials Error:`, error);
    return {
      error: "Authentication failed. Please check your credentials.",
    };
  }
}

export default function Home() {
  const { loggedIn, uri, hasError, uriData } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const fetcher = useFetcher<ActionData>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setIsLoading(false);
    }
  }, [fetcher.state, fetcher.data]);

  function handleLogin(formData: FormData) {
    setIsLoading(true);
    fetcher.submit(formData, { method: "post" });
  }

  return (
    <>
      {(actionData?.error || fetcher.data?.error) && (
        <Alert variant="error" className="mb-4">
          {actionData?.error || fetcher.data?.error}
        </Alert>
      )}
      {hasError !== null && (
        <Alert variant="warning" className="mb-4">
          {hasError}
        </Alert>
      )}

      {!loggedIn && (
        <LoginFormWithJsonPrefill
          onSubmit={handleLogin}
          isLoading={isLoading}
        />
      )}

      {loggedIn && !uri && <UriForm />}

      {loggedIn && uriData && hasError === null && (
        <div className="viewer">
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[70vh] mt-4 text-sm">
            {JSON.stringify(uriData, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}
