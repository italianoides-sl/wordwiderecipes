import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const host = 'https://www.worldwiderecipes.app';

  return {
    rules: [
      {
        userAgent: [
          'Googlebot',
          'AdsBot-Google',
          'AdsBot-Google-Mobile',
          'Mediapartners-Google',
          'Google-InspectionTool',
        ],
        allow: '/',
        disallow: '/api/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
      },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
