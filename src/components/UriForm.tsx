import { getBaseUrl } from '../constants';

interface UriFormProps {
    uri: string;
    onUriChange: (uri: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export function UriForm({ uri, onUriChange, onSubmit }: UriFormProps) {
    // Show current origin in UI, but API calls use relative URLs (proxied by nginx)
    const displayUrl = typeof window !== 'undefined' ? new URL(window.location.href).origin : '';
    // const baseUrl = getBaseUrl();
    
    return (
        <>
            {uri === '' && (
                <p className="intro">
                    Skriv inn en sti (for eksempel <code>/fint/client</code>) etter{' '}
                    <code>{displayUrl}</code> og trykk FINT!
                </p>
            )}

            <form
                onSubmit={onSubmit}
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
            >
                <span className="fint">{displayUrl}</span>
                <input
                    type="text"
                    value={uri}
                    onChange={(e) => onUriChange(e.target.value)}
                    size={80}
                    id="uri"
                />
                <input type="submit" value="FINT!" />
            </form>
        </>
    );
}

