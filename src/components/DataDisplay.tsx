import React, { useMemo } from 'react';

interface DataDisplayProps {
    loading: boolean;
    error: string | null;
    data: unknown;
}

// Escape HTML to prevent XSS
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Function to safely convert URLs in JSON string to clickable links
function linkifyUrls(jsonString: string): (string | React.ReactElement)[] {
    // Match URLs (http://, https://, or relative URLs starting with /)
    // More precise regex to avoid matching inside other JSON values
    const urlRegex = /(https?:\/\/[^\s"'<>,\]}]+|\/[^\s"'<>,\]}]+)/g;
    
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;
    
    while ((match = urlRegex.exec(jsonString)) !== null) {
        // Add text before the URL (escaped)
        if (match.index > lastIndex) {
            parts.push(escapeHtml(jsonString.substring(lastIndex, match.index)));
        }
        
        // Create safe link
        const url = match[0];
        let href: string;
        try {
            href = url.startsWith('http') 
                ? url 
                : `${window.location.origin}${url}`;
            
            // Validate URL to prevent javascript: or data: schemes
            const urlObj = new URL(href, window.location.origin);
            if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                parts.push(
                    <a 
                        key={`link-${keyCounter++}`}
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#0066cc', textDecoration: 'underline' }}
                    >
                        {url}
                    </a>
                );
            } else {
                // If invalid protocol, just show as escaped text
                parts.push(escapeHtml(url));
            }
        } catch {
            // If URL parsing fails, escape and show as text
            parts.push(escapeHtml(url));
        }
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text (escaped)
    if (lastIndex < jsonString.length) {
        parts.push(escapeHtml(jsonString.substring(lastIndex)));
    }
    
    return parts.length > 0 ? parts : [escapeHtml(jsonString)];
}

export function DataDisplay({ loading, error, data }: DataDisplayProps) {
    const jsonContent = useMemo(() => {
        if (data === null) return null;
        const jsonString = JSON.stringify(data, null, 2);
        return linkifyUrls(jsonString);
    }, [data]);

    return (
        <section style={{ marginTop: '1rem' }}>
            {loading && <div>Loading…</div>}
            {error && <pre className="error">{error}</pre>}
            {data !== null && jsonContent && (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {jsonContent}
                </pre>
            )}
        </section>
    );
}

