import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const productionUrl = 'https://vikasaservices.in';
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('vercel.app')
      ? process.env.NEXT_PUBLIC_SITE_URL
      : productionUrl;

  // Meaningful content update timestamp for indexable public pages
  const lastUpdated = new Date('2026-11-01T00:00:00.000Z');

  // Intended, canonical, indexable public URLs only
  return [
    {
      url: `${baseUrl}`,
      lastModified: lastUpdated,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/request`,
      lastModified: lastUpdated,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/worker-register`,
      lastModified: lastUpdated,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
