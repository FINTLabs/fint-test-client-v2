import { redirect } from "react-router";
import { getSession, destroySession } from "~/sessions.server";

export async function action({ request }: { request: Request }) {
  const session = await getSession(request.headers.get("Cookie"));
  const clearedSessionCookie = await destroySession(session);

  return redirect("https://idp.felleskomponent.no/nidp/app/logout", {
    headers: {
      "Set-Cookie": clearedSessionCookie,
    },
  });
}
