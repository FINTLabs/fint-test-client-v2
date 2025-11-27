import ClientOAuth2 from "client-oauth2";
import type { Auth } from "../utils/auth";
import { IDP_TOKEN_URI, OAUTH_SCOPES } from "../constants";

export async function login(
  clientId: string,
  clientSecret: string,
  username: string,
  password: string
): Promise<Auth> {
  const client = new ClientOAuth2({
    clientId,
    clientSecret,
    accessTokenUri: IDP_TOKEN_URI,
    scopes: OAUTH_SCOPES,
  });

  //TODO: can the username be displayed in the header?
  const user = await client.owner.getToken(username, password);

  // Calculate expiration date from expiresIn (seconds) or use default 1 hour
  // The token may have expiresIn as a property or in the data object
  const expiresInSeconds =
      Number((user as any).expiresIn) ||
      Number((user.data as any)?.expires_in) ||
      3600;

  const expiresDate = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return {
    accessToken: user.accessToken,
    expires: expiresDate,
  };
}
