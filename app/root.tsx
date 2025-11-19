import {
  isRouteErrorResponse,
  Links,
  type LoaderFunction,
  Meta,
  type MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigate,
} from "react-router";
import type { Route } from "./+types/root";
import "./tailwind.css";
import "@navikt/ds-css";
import "./novari-theme.css";
import { Box, Page } from "@navikt/ds-react";
import { NovariFooter, NovariHeader } from "novari-frontend-components";
import { getSession } from "~/sessions.server";

type LoaderData = {
  userId?: string;
};

export const meta: MetaFunction = () => {
  return [
    { title: "FINT Test Client" },
    { name: "description", content: "FINT Test Client" },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self' https://alpha.felleskomponent.no https://beta.felleskomponent.no https://idp.felleskomponent.no",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return Response.json(
    { userId },
    {
      headers: {
        "Content-Security-Policy": cspHeader,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    }
  );
};

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const loaderData = useLoaderData<LoaderData>();
  const userId = loaderData?.userId;

  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body data-theme="novari">
        <Page
          footer={
            <Box as="footer" background={"surface-alt-3-moderate"}>
              <NovariFooter
                links={[
                  {
                    label: "Driftsmeldinger",
                    href: "https://novari.no/driftsmeldinger/",
                  },
                ]}
              />
            </Box>
          }
        >
          <Box background={"bg-default"} className={"pb-4"}>
            <NovariHeader
              appName={"FINT Test Client"}
              showLogoWithTitle={true}
              menu={[]}
              isLoggedIn={userId !== undefined}
              displayName={userId}
              onMenuClick={(action) => navigate(action)}
              onLogout={handleLogout}
              onLogin={() => null}
            />
          </Box>

          <Page.Block as="main" width="xl" gutters>
            {children}
          </Page.Block>
        </Page>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
