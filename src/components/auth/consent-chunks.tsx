import type { ReactNode } from 'react'
import { LegalDialog } from '@/components/legal/legal-dialog'

/**
 * Builds the next-intl rich-text chunk map for the register/login consent
 * lines. The `<terms>` / `<privacy>` markers open the legal document in-place
 * as a dialog (no navigation away). `linkClassName` lets a host restyle the
 * inline trigger — e.g. light links for the login modal's over-overlay strip.
 */
export function makeConsentChunks(linkClassName?: string) {
  return {
    terms: (chunks: ReactNode) => (
      <LegalDialog namespace="terms" className={linkClassName}>
        {chunks}
      </LegalDialog>
    ),
    privacy: (chunks: ReactNode) => (
      <LegalDialog namespace="privacy" className={linkClassName}>
        {chunks}
      </LegalDialog>
    ),
  }
}

/** Default chunk map (primary-colored links) for the register/login pages. */
export const consentChunks = makeConsentChunks()
