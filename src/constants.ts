import axios from 'axios';

// Get BASE_URL from current origin, matching the old behavior: const BASE_URL = new URL(document.URL).origin;
export function getBaseUrl(): string {
   // return new URL(window.location.href).origin;

    //local: testing with beta
    return 'https://beta.felleskomponent.no';
}

// Export BASE_URL as a getter for backward compatibility
export const BASE_URL = getBaseUrl();

// Create axios instance - baseURL will be updated dynamically before each request
export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-client': 'fint-test-client',
    },
});

export const IDP_TOKEN_URI = 'https://idp.felleskomponent.no/nidp/oauth/nam/token';
export const OAUTH_SCOPES = ['fint-client'];