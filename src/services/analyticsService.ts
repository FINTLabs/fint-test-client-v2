type AnalyticsEventType = "page_view";

type AnalyticsEvent = {
  ts: string;
  app: string;
  type: AnalyticsEventType;
  path: string;
};

// Hardcoded analytics config for testing.
const ANALYTICS_BASE_URL = "http://fint-analytics-frontend:3000";
const ANALYTICS_TOKEN = "change-me";
const ANALYTICS_APP_NAME = "fint-test-client";

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getAnalyticsEndpoint(): string {
  return `${normalizeBaseUrl(ANALYTICS_BASE_URL)}/api/events`;
}

function getAnalyticsAppName(): string {
  return ANALYTICS_APP_NAME;
}

function getAnalyticsToken(): string | undefined {
  return ANALYTICS_TOKEN;
}

export function sendPageView(path: string): void {
  const endpoint = getAnalyticsEndpoint();

  const event: AnalyticsEvent = {
    ts: new Date().toISOString(),
    app: getAnalyticsAppName(),
    type: "page_view",
    path,
  };

  const token = getAnalyticsToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["x-analytics-token"] = token;
  }

  void fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(event),
    keepalive: true,
  }).catch((error) => {
    console.error("Failed to send analytics page view", error);
  });
}
