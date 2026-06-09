'use client';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function loadGa4() {
  if (document.getElementById('wwr-ga4-src')) return;

  const src = document.createElement('script');
  src.id = 'wwr-ga4-src';
  src.async = true;
  src.src = 'https://www.googletagmanager.com/gtag/js?id=G-T70F1L4P1Y';
  document.head.appendChild(src);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', 'G-T70F1L4P1Y');
}

function loadAdSense(clientId?: string) {
  if (!clientId || document.getElementById('wwr-adsense-src')) return;

  const script = document.createElement('script');
  script.id = 'wwr-adsense-src';
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

export default function ConsentScripts() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    function syncConsent() {
      const next = localStorage.getItem('consent');
      setConsent(next);
      if (next === 'full') {
        loadGa4();
        loadAdSense(process.env.NEXT_PUBLIC_ADSENSE_ID);
      }
    }

    syncConsent();
    window.addEventListener('wwr-consent-change', syncConsent);
    window.addEventListener('storage', syncConsent);
    return () => {
      window.removeEventListener('wwr-consent-change', syncConsent);
      window.removeEventListener('storage', syncConsent);
    };
  }, []);

  if (consent !== 'full') return null;
  return null;
}
