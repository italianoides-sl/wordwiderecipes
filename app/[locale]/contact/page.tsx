import { buildPageMetadata } from '@/lib/seo/metadata';

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPageMetadata({
    title: 'Contacto | WorldWideRecipes',
    description: 'Contacta con el equipo de WorldWideRecipes para prensa, colaboraciones o correcciones.',
    path: `/${params.locale}/contact`,
  });
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  const isEn = params.locale === 'en';

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
