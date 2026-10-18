import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vikasainteriors.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/request', '/worker-register', '/technician'],
        disallow: [
          '/admin',
          '/admin/',
          '/admin/*',
          '/api/',
          '/api/*',
          '/track',
          '/track/',
          '/track/*',
          '/request/success/',
          '/request/success/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
