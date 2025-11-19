import { Alert, Heading } from "@navikt/ds-react";
import { LoginFormWithJsonPrefill } from "~/components/LoginForm";
import {
  type LoaderFunction,
  useActionData,
  useFetcher,
  useLoaderData,
} from "react-router";
import { UriForm } from "~/components/UriForm";
import ClientOAuth2 from "client-oauth2";
import { useEffect, useState } from "react";
import {
  validateUriPath,
  validateUsername,
  validateClientId,
} from "~/utils/validation";
import { getAuth, setAuth, clearAuth } from "~/utils/storage";

type LoaderData = {
  uri?: string;
  hasError?: string;
};

type ActionData = {
  error?: string;
  success?: boolean;
  auth?: {
    accessToken: string;
    userId: string;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  let uri = url.search.slice(1).trim();
  // Decode URI if it's URL-encoded (starts with %2F for /)
  if (uri.startsWith("%2F")) {
    uri = decodeURIComponent(uri);
  }

  // Validate URI if present (client will make the actual API call)
  let hasError = null;
  if (uri && !validateUriPath(uri)) {
    hasError = "Ugyldig URI - URI må inneholde kun gyldige tegn";
  }

  // Auth state is checked client-side via localStorage
  return { uri, hasError };
};

export async function action({ request }: { request: Request }) {
  console.log(`[${new Date().toISOString()}] Starting log in`);

  const formData = await request.formData();
  const clientId = formData.get("clientId")?.toString();
  const clientSecret = formData.get("openIdSecret")?.toString();
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  if (!clientId || !clientSecret || !username || !password) {
    return Response.json({
      error: "All fields are required",
    });
  }

  if (!validateUsername(username)) {
    return Response.json({
      error: "Invalid username format",
    });
  }

  if (!validateClientId(clientId)) {
    return Response.json({
      error: "Invalid client ID format",
    });
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
      return Response.json({
        error: "Authentication failed. Please check your credentials.",
      });
    }
    
    console.log(`[${new Date().toISOString()}] DEBUG - Token received:`, {
      hasAccessToken: !!user.accessToken,
      accessTokenLength: user.accessToken ? user.accessToken.length : 0,
      accessTokenPreview: user.accessToken ? `${user.accessToken.substring(0, 20)}...` : "none",
      tokenType: user.tokenType,
    });

    // Return token to client to store in localStorage
    // Token expiration is handled by the server (401 response)
    return Response.json({
      success: true,
      auth: {
        accessToken: user.accessToken,
        userId: username,
      },
    });
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Credentials Error:`, error);
    return Response.json({
      error: "Authentication failed. Please check your credentials.",
    });
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
  let { uri, hasError } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const fetcher = useFetcher<ActionData>();
  const [isLoading, setIsLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [uriData, setUriData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Check auth state from localStorage on mount
  useEffect(() => {
    const auth = getAuth();
    setLoggedIn(!!auth);
  }, []);

  // Handle login success - store token in localStorage
  useEffect(() => {
    const data = actionData || fetcher.data;
    if (data?.success && data.auth) {
      setAuth(data.auth);
      setLoggedIn(true);
      setIsLoading(false);
      // Reload to clear form
      window.location.href = "/";
    } else if (data?.error) {
      setIsLoading(false);
    }
  }, [actionData, fetcher.data]);

  // Make API request when logged in and URI is present
  useEffect(() => {
    if (!loggedIn || !uri) return;

    const auth = getAuth();
    if (!auth) {
      setLoggedIn(false);
      return;
    }

    // Validate URI
    if (!validateUriPath(uri)) {
      setApiError("Ugyldig URI - URI må inneholde kun gyldige tegn");
      return;
    }

    // Make API request from client-side (like the old app)
    const apiBaseUrl = "https://beta.felleskomponent.no"; // Could be made configurable
    const apiUrl = `${apiBaseUrl}${uri}`;

    console.log(`[${new Date().toISOString()}] Making API request from client:`, apiUrl);

    setApiError(null);
    fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "x-client": "fint-test-client",
        Accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 401) {
            // Token expired or invalid - clear auth
            clearAuth();
            setLoggedIn(false);
            setApiError(`Unauthorized (401): ${errorText || "Authentication failed. Token may be expired or invalid."}`);
          } else {
            setApiError(`API Error (${response.status}): ${errorText || response.statusText}`);
          }
          setUriData(null);
        } else {
          const data = await response.json();
          setUriData(data);
          setApiError(null);
        }
      })
      .catch((error) => {
        console.error("API request error:", error);
        setApiError(`Error fetching data from the API: ${error.message}`);
        setUriData(null);
      });
  }, [loggedIn, uri]);

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
      {(hasError || apiError) && (
        <Alert variant="warning" className="mb-4">
          {hasError || apiError}
        </Alert>
      )}

      {!loggedIn && (
        <LoginFormWithJsonPrefill
          onSubmit={handleLogin}
          isLoading={isLoading}
        />
      )}

      {loggedIn && <UriForm />}

      {loggedIn && uriData && !apiError && (
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
