/**
 * Baseline security headers applied to every response (next.config.ts headers()).
 *
 * The CSP ships as Report-Only: it never blocks anything, violations only show up in the
 * browser console. Enforcing it needs a nonce for the inline scripts Next.js and next-themes
 * emit, so that is a separate change.
 */

// OAuth providers a form POST may end up redirecting to (Chrome applies form-action to the
// whole redirect chain, so the provider hosts must be listed here too).
const OAUTH_FORM_TARGETS = ['https://accounts.google.com', 'https://discord.com']

export function buildCsp(): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // Next.js RSC payload and the next-themes anti-flash snippet are inline scripts.
    'script-src': ["'self'", "'unsafe-inline'", 'https://va.vercel-scripts.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    // Card art comes from several hosts (image proxy, storage, third-party sources, OAuth avatars).
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://vitals.vercel-insights.com', 'https://va.vercel-scripts.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", ...OAUTH_FORM_TARGETS],
    'object-src': ["'none'"],
  }
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ')
}

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Content-Security-Policy-Report-Only', value: buildCsp() },
]
