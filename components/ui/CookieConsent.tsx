'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type ConsentMode = 'full' | 'essential';

function dispatchConsent() {
  window.dispatchEvent(new Event('wwr-consent-change'));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('consent');
    if (!consent) setVisible(true);
  }, []);

  function save(mode: ConsentMode) {
    localStorage.setItem('consent', mode);
    localStorage.setItem('wwr_cookie_consent', mode);
    dispatchConsent();
    setVisible(false);
  }

  function saveDetailed() {
    save(analytics && ads ? 'full' : 'essential');
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Consentimiento de cookies">
      <div style={{ width: '100%' }}>
        <p className="cookie-text">
          Usamos cookies para mejorar tu experiencia y, si lo aceptas, cargar medición y publicidad.
          Puedes revisar los detalles o consultar la <Link href="/privacy-policy"> política de privacidad</Link>.
        </p>

        {detailsOpen ? (
          <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>
              <input type="checkbox" checked disabled />
              Cookies esenciales
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              Analítica (GA4)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--ink-muted)' }}>
              <input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} />
              Publicidad (AdSense)
            </label>
          </div>
        ) : null}
      </div>

      <div className="cookie-actions">
        <button className="cookie-btn cookie-btn-primary" onClick={() => save('full')}>
          Aceptar todo
        </button>
        <button className="cookie-btn cookie-btn-secondary" onClick={() => save('essential')}>
          Solo esenciales
        </button>
        <button
          className="cookie-btn cookie-btn-minimal"
          onClick={() => {
            if (detailsOpen) {
              saveDetailed();
            } else {
              setDetailsOpen(true);
            }
          }}
        >
          Gestionar →
        </button>
      </div>
    </div>
  );
}
