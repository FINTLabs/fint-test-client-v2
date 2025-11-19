import { redirect } from "react-router";

export async function action({ request }: { request: Request }) {
  // Logout is handled client-side by clearing localStorage
  // This action just redirects - the client will clear storage
  return redirect("/");
}
