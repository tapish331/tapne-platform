'use client';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // Minimal client-side log to surface in DevTools
  try {
    console.error(JSON.stringify({ level: 'error', kind: 'global-error', message: error?.message, digest: error?.digest }));
  } catch {
    // ignore
  }

  return (
    <html>
      <body>
        <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
          <h1>Application Error</h1>
          <p>{error?.message || 'Unknown error'}</p>
          {error?.digest ? <p>Ref: {error.digest}</p> : null}
          <button onClick={() => reset()} aria-label="Reload">
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}

