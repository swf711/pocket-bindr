import type { MetadataRoute } from 'next'
import { ALLOWED_PATHS, DISALLOWED_PATHS } from '@/lib/sitemap'
import { SITE_URL } from '@/lib/og'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [...ALLOWED_PATHS],
      disallow: [...DISALLOWED_PATHS],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
