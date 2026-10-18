import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vikasainteriors.in';
  const currentDate = new Date().toISOString();

  return [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/request`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/worker-register`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/technician`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
