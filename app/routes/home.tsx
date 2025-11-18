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

  const userId = session.get("userId");
  const accessToken = session.get("accessToken");
  
  console.log(`[${new Date().toISOString()}] DEBUG - Loader called:`, {
    url: request.url,
    hasUserId: !!userId,
    userId,
    hasAccessToken: !!accessToken,
    accessTokenLength: accessToken ? accessToken.length : 0,
    uri,
    cookieHeader: request.headers.get("Cookie") ? "present" : "missing",
  });

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
      
      const accessToken = session.get("accessToken");
      const userId = session.get("userId");
      
      console.log(`[${new Date().toISOString()}] DEBUG - API Request Details:`, {
        apiBaseUrl,
        apiUrl,
        uri,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken ? accessToken.length : 0,
        accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : "none",
        userId,
        requestOrigin: baseUrl,
      });

      if (!accessToken) {
        console.log(`[${new Date().toISOString()}] DEBUG - No access token in session`);
        hasError = "No access token found. Please log in again.";
      } else {
        try {
          const requestHeaders = {
            Authorization: `Bearer ${accessToken}`,
            "x-client": "fint-test-client",
            Accept: "application/json",
          };
          
          console.log(`[${new Date().toISOString()}] DEBUG - Making API request:`, {
            url: apiUrl,
            headers: {
              ...requestHeaders,
              Authorization: `Bearer ${accessToken.substring(0, 20)}...`,
            },
          });

          const response = await fetch(apiUrl, {
            headers: requestHeaders,
          });

          console.log(`[${new Date().toISOString()}] DEBUG - API Response:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log(`[${new Date().toISOString()}] DEBUG - API Error Response Body:`, errorText);
            
            if (response.status === 401) {
              hasError = `Unauthorized (401): ${errorText || "Authentication failed. Token may be expired or invalid."}`;
            } else {
              hasError = `API Error (${response.status}): ${errorText || response.statusText}`;
            }
          } else {
            uriData = await response.json();
            console.log(`[${new Date().toISOString()}] DEBUG - API Success:`, {
              dataKeys: uriData ? Object.keys(uriData) : "null",
              dataPreview: uriData ? JSON.stringify(uriData).substring(0, 200) : "null",
            });
          }
        } catch (error) {
          console.log(`[${new Date().toISOString()}] DEBUG - API Exception:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          hasError = `Error fetching data from the API: ${error instanceof Error ? error.message : String(error)}`;
        }
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
    const accessTokenUri = "https://idp.felleskomponent.no/nidp/oauth/nam/token";
    
    console.log(`[${new Date().toISOString()}] DEBUG - Login attempt:`, {
      clientId,
      username,
      accessTokenUri,
      hasClientSecret: !!clientSecret,
      hasPassword: !!password,
    });

    const auth = new ClientOAuth2({
      clientId,
      clientSecret,
      accessTokenUri,
      scopes: ["fint-client"],
    });

    console.log(`[${new Date().toISOString()}] DEBUG - Requesting token from:`, accessTokenUri);
    const user = await auth.owner.getToken(username, password);

    if (!user) {
      console.log(`[${new Date().toISOString()}] DEBUG - Login failed: No user object returned`);
      return {
        error: "Authentication failed. Please check your credentials.",
      };
    }
    
    console.log(`[${new Date().toISOString()}] DEBUG - Token received:`, {
      hasAccessToken: !!user.accessToken,
      accessTokenLength: user.accessToken ? user.accessToken.length : 0,
      accessTokenPreview: user.accessToken ? `${user.accessToken.substring(0, 20)}...` : "none",
      tokenType: user.tokenType,
      expiresIn: user.expiresIn,
    });

    const session = await getSession(request.headers.get("Cookie"));
    session.set("userId", username);
    session.set("accessToken", user.accessToken);

    console.log(`[${new Date().toISOString()}] DEBUG - Session updated:`, {
      userId: username,
      sessionHasAccessToken: session.has("accessToken"),
    });

    const cookieHeader = await commitSession(session);
    console.log(`[${new Date().toISOString()}] DEBUG - Cookie being set:`, {
      cookieLength: cookieHeader.length,
      cookiePreview: cookieHeader.substring(0, 100) + "...",
      requestOrigin: new URL(request.url).origin,
    });

    console.log(`[${new Date().toISOString()}] Login completed`);

    return redirect("/", {
      headers: {
        "Set-Cookie": cookieHeader,
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
