'use client';
import { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

export default function AdUnit({ slot, format = 'auto', style }: AdUnitProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    function tryLoadAd() {
      const el = adRef.current;

      if (!el || !publisherId || el.dataset.checked) {
        return;
      }

      if (typeof window === 'undefined' || localStorage.getItem('consent') !== 'full') {
        return;
      }

      el.dataset.checked = 'true';

      try {
        const adsbygoogle = (window as Window & { adsbygoogle?: { push: (value: Record<string, never>) => void } }).adsbygoogle;
        adsbygoogle?.push({});
      } catch (err) {
        console.warn('AdSense not ready:', err);
      }
    }

    tryLoadAd();
    window.addEventListener('wwr-consent-change', tryLoadAd);
    window.addEventListener('storage', tryLoadAd);

    return () => {
      window.removeEventListener('wwr-consent-change', tryLoadAd);
      window.removeEventListener('storage', tryLoadAd);
    };
  }, [publisherId]);

  if (!publisherId) return null;

  return (
    <div style={{ textAlign: 'center', overflow: 'hidden', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
