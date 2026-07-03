import type { ReactNode } from 'react'
import Link from 'next/link'

/**
 * next-intl rich-text chunk map shared by the register/login consent lines.
 * Renders the `<terms>` / `<privacy>` markers in `auth.consentRegister` /
 * `auth.consentLogin` as links to the legal pages.
 */
export const consentChunks = {
  terms: (chunks: ReactNode) => (
    <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
      {chunks}
    </Link>
  ),
  privacy: (chunks: ReactNode) => (
    <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
      {chunks}
    </Link>
  ),
}
