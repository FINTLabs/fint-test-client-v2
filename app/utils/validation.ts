export function validateUsername(username: string): boolean {
  if (!username || username.length > 100) {
    return false;
  }
  const usernamePattern = /^[a-zA-Z0-9._@-]+$/;
  return usernamePattern.test(username);
}

export function validateUriPath(uri: string): boolean {
  if (!uri || uri.length > 500) {
    return false;
  }
  const uriPattern = /^\/[a-zA-Z0-9\/_-]+$/;
  return uriPattern.test(uri) && !uri.includes("..") && !uri.includes("://");
}

export function validateClientId(clientId: string): boolean {
  if (!clientId || clientId.length > 200) {
    return false;
  }
  const clientIdPattern = /^[a-zA-Z0-9_-]+$/;
  return clientIdPattern.test(clientId);
}

// export function sanitizeString(input: string): string {
//
//   return input
//     .replace(/\0/g, "")
//     .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
// }

export function validateSecretJson(obj: any): boolean {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const expectedKeys = [
    "username",
    "password",
    "clientId",
    "openIdSecret",
    "assetIds",
    "scope",
    "idpUri",
  ];

  for (const key of expectedKeys) {
    if (!(key in obj) || typeof obj[key] !== "string") {
      return false;
    }
    if (obj[key].length > 1000) {
      return false;
    }
  }

  if (obj.username && !validateUsername(obj.username)) {
    return false;
  }

  return !(obj.clientId && !validateClientId(obj.clientId));
}
