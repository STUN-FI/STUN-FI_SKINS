import type { MetadataRoute } from 'next';

const productionDomain = 'https://skins.stunfihub.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${productionDomain}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${productionDomain}/customize`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}