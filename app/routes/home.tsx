import { Alert, Heading } from "@navikt/ds-react";
import { LoginFormWithJsonPrefill } from "~/components/LoginForm";
import {
  type LoaderFunction,
  useActionData,
  useFetcher,
  useLoaderData,
  useRevalidator,
} from "react-router";
import { UriForm } from "~/components/UriForm";
import ClientOAuth2 from "client-oauth2";
import { useEffect, useState } from "react";
import { validateUriPath } from "~/utils/validation";
import { getSession, commitSession } from "~/sessions.server";

type LoaderData = {
  uri?: string;
  hasError?: string;
  isAuthenticated?: boolean;
  uriData?: any;
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
  const session = await getSession(request.headers.get("Cookie"));
  const isAuthenticated = !!session.get("accessToken");
  const accessToken = session.get("accessToken");

  const url = new URL(request.url);
  let uri = url.search.slice(1).trim();

  if (uri.endsWith('=')) {
    uri = uri.slice(0, -1);
  }

  if (uri && uri.includes("%")) {
    try {
      uri = decodeURIComponent(uri);
    } catch (e) {
      console.warn("Failed to decode URI:", uri);
    }
  }

  if (uri && !uri.startsWith("/")) {
    uri = `/${uri}`;
  }

  let hasError = null;
  if (uri && !validateUriPath(uri)) {
    hasError = "Ugyldig URI - URI må inneholde kun gyldige tegn";
  }

  let uriData = null;
  if (isAuthenticated && uri && !hasError && accessToken) {
    try {
      const apiBaseUrl = "https://beta.felleskomponent.no";
      const apiUrl = `${apiBaseUrl}${uri}`;


      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-client": "fint-test-client",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          hasError = `Unauthorized (401): ${errorText || "Authentication failed. Token may be expired or invalid."}`;
        } else {
          hasError = `API Error (${response.status}): ${errorText || response.statusText}`;
        }
      } else {
        uriData = await response.json();
      }
    } catch (error) {
      console.error("API request error:", error);
      hasError = `Error fetching data from the API: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  return { uri, hasError, isAuthenticated, uriData };
};

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

function SafeJsonViewer({ data }: { data: any }) {
  return (
    <div className="bg-gray-100 p-4 rounded overflow-auto max-h-[70vh] mt-4 text-sm font-mono whitespace-pre-wrap break-words">
      {renderJsonWithLinks(data)}
    </div>
  );
}

export default function Home() {
  let { uri, hasError, isAuthenticated, uriData } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const fetcher = useFetcher<ActionData>();
  const revalidate = useRevalidator();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const data = actionData || fetcher.data;
    if (data?.success && data.auth) {
      setIsLoading(false);
      revalidate.revalidate();
    } else if (data?.error) {
      setIsLoading(false);
    }
  }, [actionData, fetcher.data, revalidate]);

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
      {hasError && (
        <Alert variant="warning" className="mb-4">
          {hasError}
        </Alert>
      )}

      {!isAuthenticated && (
        <LoginFormWithJsonPrefill
          onSubmit={handleLogin}
          isLoading={isLoading}
        />
      )}

      {isAuthenticated && <UriForm />}

      {isAuthenticated && uriData && !hasError && (
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

export async function action({ request }: { request: Request }) {
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

  try {
    const accessTokenUri = "https://idp.felleskomponent.no/nidp/oauth/nam/token";

    const auth = new ClientOAuth2({
      clientId,
      clientSecret,
      accessTokenUri,
      scopes: ["fint-client"],
    });

    const user = await auth.owner.getToken(username, password);

    if (!user) {
      return Response.json({
        error: "Authentication failed. Please check your credentials.",
      });
    }

    const session = await getSession(request.headers.get("Cookie"));
    session.set("accessToken", user.accessToken);
    session.set("userId", username);

    return Response.json(
      {
        success: true,
        auth: {
          accessToken: user.accessToken,
          userId: username,
        },
      },
      {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      }
    );
  } catch (error) {
    return Response.json({
      error: "Authentication failed. Please check your credentials.",
    });
  }
}