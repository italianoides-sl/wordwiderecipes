import { buildPageMetadata } from '@/lib/seo/metadata';

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPageMetadata({
    title: 'Términos de Uso | WorldWideRecipes',
    description: 'Términos y condiciones de uso de worldwiderecipes.app.',
    path: `/${params.locale}/terms`,
  });
}

export default function TermsPage({ params }: { params: { locale: string } }) {
  const year = new Date().getFullYear();
  const isEn = params.locale === 'en';

  if (isEn) {
    return (
      <main className="da-legal">
        <div className="da-legal-inner">
          <p className="da-legal-kicker">Legal</p>
          <h1>Terms of Use</h1>
          <p className="da-legal-date">Effective: {year}</p>
          <h2>Informational content only</h2>
          <p>The recipes, techniques, and ingredient information on WorldWideRecipes are for informational purposes only. They do not constitute medical, nutritional, or dietary advice. Always consult a qualified professional regarding allergies, medical conditions, or specific diets.</p>
          <h2>Affiliate links</h2>
          <p>Some links on this site are Amazon affiliate links. We earn a small commission on qualifying purchases at no additional cost to you.</p>
          <h2>AI-generated content</h2>
          <p>Content on this site is generated with Gemini AI and reviewed editorially for quality, accuracy, and cultural context. WorldWideRecipes is responsible for all published content.</p>
          <h2>Intellectual property</h2>
          <p>All content on worldwiderecipes.app is the intellectual property of WorldWideRecipes unless otherwise noted. You may not reproduce or redistribute content without written permission.</p>
          <h2>Governing law</h2>
          <p>These terms are governed by the laws of Spain.</p>
          <h2>Contact</h2>
          <p><a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a></p>
        </div>
      </main>
    );
  }

  return (
    <main className="da-legal">
      <div className="da-legal-inner">
        <p className="da-legal-kicker">Legal</p>
        <h1>Términos de Uso</h1>
        <p className="da-legal-date">Vigente: {year}</p>

        <h2>Contenido informativo</h2>
        <p>Las recetas, técnicas e ingredientes de WorldWideRecipes son contenido informativo. No constituyen consejo médico, nutricional ni dietético. Consulta siempre a un profesional cualificado antes de hacer cambios en tu alimentación, especialmente si tienes alergias, intolerancias o condiciones médicas.</p>

        <h2>Enlaces de afiliado</h2>
        <p>Algunos enlaces de este sitio son enlaces de afiliado de Amazon. Ganamos una pequeña comisión por compras realizadas a través de dichos enlaces, sin coste adicional para ti.</p>

        <h2>Contenido generado con IA</h2>
        <p>El contenido de este sitio se genera con Gemini AI y se revisa editorialmente para garantizar calidad, precisión y contexto cultural. WorldWideRecipes es responsable de todo el contenido publicado.</p>

        <h2>Propiedad intelectual</h2>
        <p>Todo el contenido de worldwiderecipes.app es propiedad intelectual de WorldWideRecipes, salvo indicación contraria. No puedes reproducir ni redistribuir contenido sin permiso escrito.</p>

        <h2>Ley aplicable</h2>
        <p>Estos términos se rigen por la legislación española.</p>

        <h2>Contacto</h2>
        <p><a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a></p>
      </div>
    </main>
  );
}
