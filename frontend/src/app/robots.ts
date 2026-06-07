import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/profile/edit', '/org/', '/admin/', '/settings', '/messages', '/notifications', '/auth/'],
    },
    sitemap: 'https://www.linksports.in/sitemap.xml',
  };
}
