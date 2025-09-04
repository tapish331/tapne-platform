'use client';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <html>
      <body>
        <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>{error?.message || 'Unknown error'}</p>
          {error?.digest ? <p>Ref: {error.digest}</p> : null}
          <button onClick={() => reset()} aria-label="Try again">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

