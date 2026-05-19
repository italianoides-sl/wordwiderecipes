import { headers } from 'next/headers';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return buildPageMetadata({
    title: 'Sobre WorldWideRecipes | El atlas culinario mundial',
    description: 'Somos un proyecto editorial de gastronomía mundial creado por un chef profesional en Ibiza.',
    path: '/about',
  });
}

export default function AboutPage() {
  const locale = headers().get('x-locale') ?? 'es';
  const isEn = locale === 'en';
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  if (isEn) {
    return (
      <main className="da-legal">
        <div className="da-legal-inner">
          <p className="da-legal-kicker">About</p>
          <h1>About WorldWideRecipes</h1>
          <p>WorldWideRecipes is a culinary atlas built by a professional chef based in Ibiza. Our mission: make the world&apos;s gastronomy accessible in Spanish and English, with editorial rigour and a chef&apos;s perspective.</p>
          <p>Our articles are written with artificial intelligence assistance (OpenAI) and reviewed against editorial quality standards before publication. Each page includes real cultural context, verified techniques, and a human perspective.</p>
          <p>We&apos;re also <strong><a href={tiktokUrl} target="_blank" rel="noopener noreferrer">@tuvirtualchef</a></strong> on TikTok, where we publish photo-recipes in under a minute: swipe, read, cook.</p>

          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '6px', padding: '20px', margin: '32px 0' }}>
            <strong style={{ color: 'var(--da-gold)', display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amazon Disclosure</strong>
            <p style={{ margin: 0 }}>As an Amazon Associate, worldwiderecipes.app earns from qualifying purchases. This means we may earn a commission when you click on affiliate links and make a purchase, at no additional cost to you.</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '20px', margin: '32px 0' }}>
            <strong style={{ color: 'var(--da-ink-muted)', display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Advertising Disclosure</strong>
            <p style={{ margin: 0 }}>This site uses Google AdSense to display ads. Google may use cookies to serve ads based on your prior visits to this website or other sites. You can opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
          </div>

          <h2>Contact</h2>
          <p>For press, collaborations, or content corrections: <a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a></p>
        </div>
      </main>
    );
  }

  return (
    <main className="da-legal">
      <div className="da-legal-inner">
        <p className="da-legal-kicker">Sobre nosotros</p>
        <h1>Sobre WorldWideRecipes</h1>
        <p>WorldWideRecipes es un atlas culinario creado por un chef profesional con base en Ibiza. Nuestra misión: hacer accesible la gastronomía mundial en español e inglés, con rigor editorial y mirada de chef.</p>
        <p>Nuestros artículos son redactados con asistencia de inteligencia artificial (OpenAI) y revisados por estándares de calidad editorial antes de publicarse. Cada página incluye contexto cultural real, técnicas verificadas y una perspectiva humana.</p>
        <p>También somos <strong><a href={tiktokUrl} target="_blank" rel="noopener noreferrer">@tuvirtualchef</a></strong> en TikTok, donde publicamos foto-recetas de menos de un minuto: desliza, lee, cocina.</p>

        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '6px', padding: '20px', margin: '32px 0' }}>
          <strong style={{ color: 'var(--da-gold)', display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Divulgación Amazon</strong>
          <p style={{ margin: 0 }}>Como Afiliado de Amazon, worldwiderecipes.app obtiene ingresos por las compras adscritas que cumplen los requisitos aplicables. Esto significa que podemos ganar una comisión cuando haces clic en nuestros enlaces de afiliado y realizas una compra, sin coste adicional para ti.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '20px', margin: '32px 0' }}>
          <strong style={{ color: 'var(--da-ink-muted)', display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Publicidad</strong>
          <p style={{ margin: 0 }}>Este sitio utiliza Google AdSense para mostrar anuncios. Google puede utilizar cookies para mostrar anuncios basados en tus visitas anteriores a este u otros sitios web. Puedes desactivar la publicidad personalizada en <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Configuración de anuncios de Google</a>.</p>
        </div>

        <h2>Contacto</h2>
        <p>Para prensa, colaboraciones o correcciones de contenido: <a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a>. Respondemos en 48h.</p>
      </div>
    </main>
  );
}
