'use client';
import { useEffect, useState } from 'react';
import type { Content } from '@/lib/db/schema';

const JUMP_LINKS = [
  { id: 'sec-ingredientes', label: 'Ingredientes' },
  { id: 'sec-pasos', label: 'Paso a paso' },
  { id: 'sec-herramientas', label: 'Herramientas' },
  { id: 'sec-faq', label: 'Preguntas frecuentes' },
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
    <div className="sidebar-card">
      <span className="sidebar-label">En este artículo</span>
      <nav className="jump-nav" aria-label="Saltar a sección">
        <ol>
          {JUMP_LINKS.map((link, index) => (
            <li key={link.id} className={active === link.id ? 'active' : ''}>
              <a
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(link.id);
                  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
                }}
              >
                <span className="jump-num">{String(index + 1).padStart(2, '0')}</span>
                <span>{link.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
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
    <div className="sidebar-newsletter">
      <h3 className="sidebar-nl-title">Una receta nueva cada semana</h3>
      <p className="sidebar-nl-sub">Sin spam. Solo cocina buena, directo a tu bandeja.</p>
      {state === 'success' ? (
        <div className="sidebar-nl-sub">✓ Revisa tu correo para confirmar.</div>
      ) : (
        <form onSubmit={onSubmit}>
          <input
            className="sidebar-nl-input"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="sidebar-nl-btn" type="submit" disabled={state === 'loading'}>
            {state === 'loading' ? 'Enviando…' : 'Suscribirse'}
          </button>
        </form>
      )}
      {state === 'error' ? <p className="sidebar-nl-sub" style={{ marginTop: '10px' }}>Error al suscribir. Inténtalo de nuevo.</p> : null}
    </div>
  );
}

export default function Sidebar({ content, className = '' }: { content: Content; className?: string }) {
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  return (
    <aside className={`sidebar ${className}`.trim()}>
      <JumpNav />
      <Newsletter />
      <div className="sidebar-tiktok">
        <div className="sidebar-tt-eyebrow">
          <span className="sidebar-tt-dot" />
          En directo
        </div>
        <h3 className="sidebar-tt-title">Vídeos nuevos cada semana</h3>
        <p className="sidebar-tt-sub">Recetas en vídeo, trucos de chef y cocina en tiempo real.</p>
        <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="sidebar-tt-btn">
          ↗ @tuvirtualchef
        </a>
      </div>
    </aside>
  );
}
