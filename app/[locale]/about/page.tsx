import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPageMetadata({
    title: 'Sobre WorldWideRecipes | El atlas culinario mundial',
    description: 'Somos un proyecto editorial de gastronomía mundial creado por un chef profesional en Ibiza.',
    path: `/${params.locale}/about`,
  });
}

export default function AboutPage({ params }: { params: { locale: string } }) {
  const isEn = params.locale === 'en';
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef';

  if (isEn) {
    return (
      <main className="da-legal">
        <div className="da-legal-inner">
          <p className="da-legal-kicker">About</p>
          <h1>About WorldWideRecipes</h1>
          <p>WorldWideRecipes is a culinary atlas built by a professional chef based in Ibiza. Our mission: make the world&apos;s gastronomy accessible in Spanish and English, with editorial rigour and a chef&apos;s perspective.</p>
          <p>Each article — recipe, technique, ingredient, guide — is generated with <strong>Gemini AI</strong> and reviewed editorially for accuracy, cultural context, and culinary quality.</p>
          <p>We&apos;re also <strong><a href={tiktokUrl} target="_blank" rel="noopener noreferrer">@tuvirtualchef</a></strong> on TikTok, where we publish photo-recipes in under a minute: swipe, read, cook.</p>

          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '6px', padding: '20px', margin: '32px 0' }}>
            <strong style={{ color: 'var(--da-gold)', display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amazon Disclosure</strong>
            <p style={{ margin: 0 }}>As an Amazon Associate, worldwiderecipes.app earns from qualifying purchases. This means we may earn a commission when you click on affiliate links and make a purchase, at no additional cost to you.</p>
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
        <p>Cada artículo — receta, técnica, ingrediente, guía — se genera con <strong>Gemini AI</strong> y se revisa editorialmente para garantizar precisión, contexto cultural y calidad culinaria real.</p>
        <p>También somos <strong><a href={tiktokUrl} target="_blank" rel="noopener noreferrer">@tuvirtualchef</a></strong> en TikTok, donde publicamos foto-recetas de menos de un minuto: desliza, lee, cocina.</p>

        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '6px', padding: '20px', margin: '32px 0' }}>
          <strong style={{ color: 'var(--da-gold)', display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Divulgación Amazon</strong>
          <p style={{ margin: 0 }}>Como Afiliado de Amazon, worldwiderecipes.app obtiene ingresos por las compras adscritas que cumplen los requisitos aplicables. Esto significa que podemos ganar una comisión cuando haces clic en nuestros enlaces de afiliado y realizas una compra, sin coste adicional para ti.</p>
        </div>

        <h2>Contacto</h2>
        <p>Para prensa, colaboraciones o correcciones de contenido: <a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a>. Respondemos en 48h.</p>
      </div>
    </main>
  );
}
