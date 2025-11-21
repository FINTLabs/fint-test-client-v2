export function getInitialUri(): string {
    if (window.location.search.length > 1) {
        // Get everything after the ? without decoding
        return window.location.search.slice(1);
    }
    return '';
}

export function updateUrl(uri: string): void {
    // Put the path directly after ? without encoding
    history.pushState(null, '', `?${uri}`);
}

