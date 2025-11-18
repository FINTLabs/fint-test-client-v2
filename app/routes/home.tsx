import { Alert, Heading } from "@navikt/ds-react";
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
import {
  validateUriPath,
  validateUsername,
  validateClientId,
} from "~/utils/validation";

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
    if (!validateUriPath(uri)) {
      hasError = "Ugyldig URI - URI må inneholde kun gyldige tegn";
    } else {
      const baseUrl = new URL(request.url).origin;

      console.log(`[${new Date().toISOString()}] Starting URI:`, baseUrl + uri);

      const url = new URL(request.url);
      url.search = `?${uri.trim()}`;

      // Use beta API for all test environments (alpha, beta, etc.)
      // Can be overridden with FINT_API_URL environment variable
      const apiBaseUrl = process.env.FINT_API_URL || "https://beta.felleskomponent.no";
      const apiUrl = `${apiBaseUrl}${uri}`;
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

  if (!validateUsername(username)) {
    return {
      error: "Invalid username format",
    };
  }

  if (!validateClientId(clientId)) {
    return {
      error: "Invalid client ID format",
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

// function formatJsonWithLinks(json: any): string {
//   const jsonString = JSON.stringify(json, null, 2);
//   return jsonString.replace(
//     /(https?:\/\/[^\s"]+)/g,
//     (match) => `<a href="#"  class="text-blue-600 hover:underline">${match}</a>`
//   );
// }

import React from "react";

function renderJsonWithLinks(value: any): React.ReactNode {
  if (typeof value === "string") {
    const urlPattern = /^https?:\/\/[^\s<>"']+$/i;
    if (urlPattern.test(value) && value.length < 2048) {
      const lowerValue = value.toLowerCase();
      if (
        !lowerValue.startsWith("javascript:") &&
        !lowerValue.startsWith("data:")
      ) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-words"
          >
            {value}
          </a>
        );
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="pl-4 list-disc">
        {value.map((item, index) => (
          <li key={index}>{renderJsonWithLinks(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div className="pl-2 border-l border-gray-300">
        {Object.entries(value).map(([key, val], index) => (
          <div key={index}>
            <span className="font-mono font-semibold">{key}:</span>{" "}
            {renderJsonWithLinks(val)}
          </div>
        ))}
      </div>
    );
  }

  return String(value);
}

// function SafeJsonViewer({ data }: { data: any }) {
//   return (
//     <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[70vh] mt-4 text-sm">
//       {JSON.stringify(data, null, 2)}
//     </pre>
//   );
// }
function SafeJsonViewer({ data }: { data: any }) {
  return (
    <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[70vh] mt-4 text-sm font-mono whitespace-pre-wrap break-words">
      {renderJsonWithLinks(data)}
    </div>
  );
}

export default function Home() {
  let { loggedIn, uri, hasError, uriData } = useLoaderData<LoaderData>();
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

      {loggedIn && <UriForm />}

      {/*{loggedIn && uriData && hasError === null && (*/}
      {/*  <div className="viewer">*/}
      {/*    <pre*/}
      {/*      className="bg-gray-100 p-4 rounded overflow-auto max-h-[70vh] mt-4 text-sm"*/}
      {/*      dangerouslySetInnerHTML={{ __html: formatJsonWithLinks(uriData) }}*/}
      {/*    />*/}
      {/*  </div>*/}
      {/*)}*/}

      {loggedIn && uriData && hasError === null && (
        <>
          <Heading size={"small"}>Loaded data: {uri}</Heading>
          <div className="viewer">
            <SafeJsonViewer data={uriData} />
          </div>
        </>
      )}
    </>
  );
}
