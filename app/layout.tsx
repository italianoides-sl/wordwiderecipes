import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  AUTHOR_LOCATION,
  AUTHOR_NAME,
  AUTHOR_ROLE,
  AUTHOR_URL,
  LOGO_URL,
  SITE_EMAIL,
  SITE_NAME,
  SITE_URL,
  TIKTOK_URL,
} from '@/lib/seo/site';
import './globals.css';

const siteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: LOGO_URL,
      sameAs: [TIKTOK_URL],
      founder: { '@id': `${AUTHOR_URL}#person` },
      contactPoint: {
        '@type': 'ContactPoint',
        email: SITE_EMAIL,
        contactType: 'editorial',
      },
      knowsAbout: [
        'recetas internacionales',
        'técnicas de cocina',
        'ingredientes regionales',
        'gastronomía mexicana',
        'gastronomía española',
        'cultura alimentaria',
      ],
    },
    {
      '@type': 'Person',
      '@id': `${AUTHOR_URL}#person`,
      name: AUTHOR_NAME,
      url: AUTHOR_URL,
      jobTitle: AUTHOR_ROLE,
      homeLocation: {
        '@type': 'Place',
        name: AUTHOR_LOCATION,
      },
      worksFor: { '@id': `${SITE_URL}/#organization` },
      sameAs: [TIKTOK_URL],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: ['es'],
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: SITE_NAME,
  description: 'Recetas, tecnicas, ingredientes y guias de gastronomia mundial con criterio editorial y mirada de chef.',
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: 'Recetas, tecnicas, ingredientes y guias de gastronomia mundial con criterio editorial y mirada de chef.',
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Recetas, tecnicas, ingredientes y guias de gastronomia mundial con criterio editorial y mirada de chef.',
    images: ['/logo.png'],
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js" />
        <script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js" />
        <script async src="//www.ezojs.com/ezoic/sa.min.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.ezstandalone = window.ezstandalone || {};
              window.ezstandalone.cmd = window.ezstandalone.cmd || [];
            `,
          }}
        />
        <script src="//ezoicanalytics.com/analytics.js" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="WorldWideRecipes RSS"
          href={`${SITE_URL}/feed.xml`}
        />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&family=Neuton:ital,wght@0,200;0,300;0,400;0,700;0,800;1,400&family=Josefin+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet" />
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WBZ5KRXW');`}
        </Script>
        <Script
          id="site-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData) }}
        />
      </head>
      <body>
        <div className="site-shell">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
