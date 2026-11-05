import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const productionUrl = 'https://vikasaservices.in';
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('vercel.app')
      ? process.env.NEXT_PUBLIC_SITE_URL
      : productionUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
        ],
      },
      {
        userAgent: ['OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended'],
        allow: ['/'],
        disallow: [
          '/admin',
          '/admin/*',
          '/api',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
