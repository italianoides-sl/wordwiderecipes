import { buildPageMetadata } from '@/lib/seo/metadata';

export function generateMetadata({ params }: { params: { locale: string } }) {
  return buildPageMetadata({
    title: 'Política de Privacidad | WorldWideRecipes',
    description: 'Política de privacidad, cookies, afiliados, datos y derechos de usuario de worldwiderecipes.app.',
    path: `/${params.locale}/privacy-policy`,
  });
}

export default function PrivacyPolicyPage({ params }: { params: { locale: string } }) {
  const year = new Date().getFullYear();
  const isMx = params.locale === 'es-mx';
  const isEn = params.locale === 'en';

  if (isEn) {
    return (
      <main className="da-legal">
        <div className="da-legal-inner">
          <p className="da-legal-kicker">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="da-legal-date">Last updated: {year}</p>

          <h2>Who we are</h2>
          <p>WorldWideRecipes is a culinary editorial platform available at worldwiderecipes.app, created by a professional chef based in Ibiza.</p>

          <h2>Data we collect</h2>
          <p>We may collect technical data through Google Analytics (site performance), Google AdSense (advertising), Unsplash photo attribution data, and the email address you voluntarily provide to subscribe to our Brevo-powered newsletter.</p>

          <h2>We do not sell personal data</h2>
          <p>We do not sell personal data to third parties. Technical providers (Google, Brevo, Neon, Vercel) process data only for the services they provide.</p>

          <h2>Google AdSense</h2>
          <p>We use Google AdSense to display relevant advertising. Google may use cookies to serve ads based on prior visits to this and other websites. Read Google&apos;s privacy policy at <a href="https://policies.google.com/privacy" rel="nofollow" target="_blank">policies.google.com/privacy</a>.</p>

          <h2>Amazon Associates</h2>
          <p>worldwiderecipes.app is a participant in the Amazon Services LLC Associates Program. We earn commissions from qualifying purchases made through our affiliate links, at no additional cost to you.</p>

          <h2>GDPR rights</h2>
          <p>You have the right to access, rectify, erase, object to, and request portability of your personal data. To exercise these rights, contact: <a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a>.</p>

          <h2>Cookies</h2>
          <p>We use: essential session cookies (site operation), analytics cookies (Google Analytics), advertising cookies (Google AdSense), and local storage to remember your consent preferences.</p>

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
        <h1>Política de Privacidad</h1>
        <p className="da-legal-date">Última actualización: {year}</p>

        <h2>Responsable</h2>
        <p>WorldWideRecipes, plataforma editorial de gastronomía disponible en worldwiderecipes.app, creada por un chef profesional con base en Ibiza, España.</p>

        <h2>Datos que recopilamos</h2>
        <p>Podemos recopilar datos a través de cookies de Google Analytics (análisis de rendimiento), cookies de Google AdSense (publicidad), datos de atribución fotográfica de Unsplash, y el correo electrónico que facilites para nuestra newsletter gestionada con Brevo.</p>

        <h2>No vendemos datos personales</h2>
        <p>No vendemos datos personales a terceros. Los proveedores técnicos (Google, Brevo, Neon, Vercel) solo tratan datos para los servicios que prestan.</p>

        <h2>Google AdSense</h2>
        <p>Utilizamos Google AdSense para mostrar publicidad relevante. Google puede usar cookies para publicar anuncios basados en visitas anteriores a este u otros sitios. Consulta la política de Google en <a href="https://policies.google.com/privacy" rel="nofollow" target="_blank">policies.google.com/privacy</a>.</p>

        <h2>Amazon Associates</h2>
        <p>worldwiderecipes.app participa en el Programa de Afiliados de Amazon Services LLC. Ganamos comisiones por compras realizadas a través de nuestros enlaces de afiliado, sin coste adicional para ti.</p>

        <h2>{isMx ? 'Derechos LFPDPPP' : 'Derechos RGPD'}</h2>
        <p>
          Tienes derecho de acceso, rectificación, supresión, oposición y portabilidad de tus datos.
          {isMx && ' En México, estos derechos se atienden conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).'}
          {' '}Para ejercerlos: <a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a>.
        </p>

        <h2>Cookies</h2>
        <p>Usamos: cookies esenciales de sesión (funcionamiento del sitio), cookies de analítica (Google Analytics), cookies publicitarias (Google AdSense), y almacenamiento local para recordar tu preferencia de consentimiento.</p>

        <h2>Contacto</h2>
        <p><a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a></p>
      </div>
    </main>
  );
}
