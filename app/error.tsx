'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  if (process.env.NODE_ENV !== 'production') console.error(error);
  return (
    <main className="da-notfound">
      <div className="da-notfound-inner">
        <span className="da-notfound-num" style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}>Error</span>
        <h1>Algo salió mal</h1>
        <p>Se produjo un error inesperado. Puedes intentarlo de nuevo o volver al inicio.</p>
        <div className="da-notfound-actions">
          <button className="da-btn da-btn--primary" onClick={reset}>
            Intentar de nuevo
          </button>
          <a href="/" className="da-btn da-btn--ghost">Ir al inicio</a>
        </div>
      </div>
    </main>
  );
}
