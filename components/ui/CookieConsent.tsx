'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('wwr_cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  function accept(type: 'all' | 'essential') {
    localStorage.setItem('wwr_cookie_consent', type);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="da-cookie" role="dialog" aria-label="Consentimiento de cookies">
      <p className="da-cookie-text">
        Usamos cookies para mejorar tu experiencia y mostrar anuncios relevantes.{' '}
        <Link href="/privacy-policy" className="da-cookie-link">
          Consulta nuestra política de privacidad.
        </Link>
      </p>
      <div className="da-cookie-actions">
        <button className="da-cookie-btn da-cookie-btn--primary" onClick={() => accept('all')}>
          Aceptar todo
        </button>
        <button className="da-cookie-btn da-cookie-btn--ghost" onClick={() => accept('essential')}>
          Solo esenciales
        </button>
      </div>
    </div>
  );
}
