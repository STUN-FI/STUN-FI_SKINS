import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/customize'],
      disallow: ['/admin', '/orders', '/api/'],
    },
    sitemap: 'https://skins.stunfihub.com/sitemap.xml',
  };
}