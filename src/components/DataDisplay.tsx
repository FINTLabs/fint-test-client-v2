interface DataDisplayProps {
    loading: boolean;
    error: string | null;
    data: unknown;
}

export function DataDisplay({ loading, error, data }: DataDisplayProps) {
    return (
        <section style={{ marginTop: '1rem' }}>
            {loading && <div>Loading…</div>}
            {error && <pre className="error">{error}</pre>}
            {data !== null && (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            )}
        </section>
    );
}

