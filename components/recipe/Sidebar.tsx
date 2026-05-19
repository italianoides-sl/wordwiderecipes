'use client';
import { useEffect, useState } from 'react';
import type { Content } from '@/lib/db/schema';
import AdUnit from '@/components/ui/AdUnit';

const JUMP_LINKS = [
  { id: 'sec-ingredientes', label: 'Ingredientes' },
  { id: 'sec-pasos', label: 'Paso a paso' },
  { id: 'sec-herramientas', label: 'Herramientas' },
  { id: 'sec-faq', label: 'Preguntas' },
];

function JumpNav() {
  const [active, setActive] = useState('sec-ingredientes');

  useEffect(() => {
    const els = JUMP_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="sb-jump" aria-label="Saltar a sección">
      <span className="sb-kicker">En este artículo</span>
      <ol>
        {JUMP_LINKS.map((l, i) => (
          <li key={l.id} className={active === l.id ? 'is-active' : ''}>
            <a
              href={`#${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(l.id);
                if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
              }}
            >
              <span className="sb-jump-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="sb-jump-label">{l.label}</span>
              <span className="sb-jump-bar" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setState('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="sb-newsletter">
      <div className="sb-nl-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="8" width="24" height="18" rx="1"/>
          <path d="M4 9l12 9 12-9"/>
        </svg>
      </div>
      <span className="sb-kicker">Boletín semanal</span>
      <h3 className="sb-nl-title">Una receta nueva cada semana.</h3>
      <p className="sb-nl-sub">Sin spam. Solo gastronomía mundial, en tu correo.</p>
      {state === 'success' ? (
        <div className="sb-nl-success" role="status">✓ Listo. Revisa tu correo para confirmar.</div>
      ) : (
        <form className="sb-nl-form" onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Correo electrónico"
            required
          />
          <button type="submit" disabled={state === 'loading'}>
            {state === 'loading' ? 'Enviando…' : 'Suscribir'}
          </button>
        </form>
      )}
      {state === 'error' && <p style={{ color: 'var(--wwr-danger)', fontSize: '13px', marginTop: '8px' }}>Error al suscribir. Inténtalo de nuevo.</p>}
    </div>
  );
}

export default function Sidebar({ content }: { content: Content }) {
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';
  const topAffiliate = content.affiliateLinks?.[0];

  return (
    <aside className="rp-sidebar">
      <div className="rp-sidebar-sticky">
        <JumpNav />

        <a
          className="sb-tiktok"
          href={tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="sb-tt-spine" aria-hidden="true" />
          <div className="sb-tt-eyebrow">
            <span className="sb-tt-pulse" aria-hidden="true" />
            FOTO-RECETAS · @tuvirtualchef
          </div>
          <h3 className="sb-tt-title">Aprende a cocinar en menos de 1 minuto.</h3>
          <p className="sb-tt-sub">Foto-recetas paso a paso. Desliza, lee, cocina.</p>
          <div className="sb-tt-footer">
            <span className="sb-tt-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="14" height="14">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.84z"/>
              </svg>
              Ver en TikTok
            </span>
            <span className="sb-tt-views">@tuvirtualchef</span>
          </div>
        </a>

        {topAffiliate && (
          <a
            className="sb-affil"
            href={topAffiliate.url}
            target="_blank"
            rel="nofollow sponsored"
          >
            <header className="sb-affil-head">
              <span className="sb-affil-kicker">Producto destacado</span>
              <span className="sb-affil-badge">Más vendido</span>
            </header>
            <div className="sb-affil-body">
              <div className="sb-affil-img" style={{ background: 'linear-gradient(135deg, #2A1208 0%, #6E2A1A 100%)' }} aria-hidden="true">
                <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
                  <g stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 42h56v34a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V42z"/>
                    <path d="M18 42h64M30 32v10M70 32v10"/>
                  </g>
                </svg>
              </div>
              <div className="sb-affil-info">
                <h4>{topAffiliate.label}</h4>
                <p>Amazon</p>
              </div>
            </div>
            <span className="sb-affil-cta">
              Ver en Amazon
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9h12M10 4l5 5-5 5"/>
              </svg>
            </span>
          </a>
        )}

        <Newsletter />
        <AdUnit slot="1122334455" format="vertical" style={{ marginTop: '24px' }} />
      </div>
    </aside>
  );
}
