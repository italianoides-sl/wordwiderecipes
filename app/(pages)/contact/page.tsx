import { headers } from 'next/headers';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'Contacto | WorldWideRecipes',
    description: 'Contacta con el equipo de WorldWideRecipes para prensa, colaboraciones o correcciones.',
    path: '/contact',
  });
}

export default function ContactPage() {
  const locale = headers().get('x-locale') ?? 'es';
  const isEn = locale === 'en';

  return (
    <main className="da-legal">
      <div className="da-legal-inner">
        <p className="da-legal-kicker">{isEn ? 'Contact' : 'Contacto'}</p>
        <h1>{isEn ? 'Contact' : 'Contacto'}</h1>
        <p>
          {isEn
            ? 'For press, collaborations, and content corrections:'
            : 'Para prensa, colaboraciones y correcciones de contenido:'}
        </p>
        <p>
          <a href="mailto:contact@worldwiderecipes.app" style={{ color: 'var(--da-gold)', fontSize: '18px', fontWeight: 500 }}>
            contact@worldwiderecipes.app
          </a>
        </p>
        <p style={{ color: 'var(--da-ink-muted)', fontStyle: 'italic' }}>
          {isEn ? 'We reply within 48 hours.' : 'Respondemos en 48 horas.'}
        </p>
      </div>
    </main>
  );
}
