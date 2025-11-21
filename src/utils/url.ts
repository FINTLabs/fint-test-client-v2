// Validate URI path to prevent XSS and injection attacks
function isValidUriPath(path: string): boolean {
    // Only allow paths starting with / and containing safe characters
    // Reject: script tags, javascript:, data:, and other dangerous patterns
    if (!path.startsWith('/')) return false;
    if (path.includes('<') || path.includes('>') || path.includes('"') || path.includes("'")) return false;
    if (path.toLowerCase().includes('javascript:') || path.toLowerCase().includes('data:')) return false;
    if (path.includes('..')) return false; // Prevent directory traversal
    // Allow alphanumeric, slashes, hyphens, underscores, and common path characters
    return /^\/[a-zA-Z0-9\/_\-.]+$/.test(path);
}

export function getInitialUri(): string {
    if (window.location.search.length > 1) {
        // Get everything after the ? without decoding
        const uri = window.location.search.slice(1);
        // Validate and sanitize the URI
        if (isValidUriPath(uri)) {
            return uri;
        }
        // If invalid, return empty string to prevent XSS
        return '';
    }
    return '';
}

export function updateUrl(uri: string): void {
    // Validate before updating URL
    if (!isValidUriPath(uri)) {
        console.error('Invalid URI path:', uri);
        return;
    }
    // Put the path directly after ? without encoding
    history.pushState(null, '', `?${uri}`);
}

