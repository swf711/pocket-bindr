import type { ReactNode } from 'react'
import { LegalDialog } from '@/components/legal/legal-dialog'

/**
 * next-intl rich-text chunk map shared by the register/login consent lines.
 * Renders the `<terms>` / `<privacy>` markers in `auth.consentRegister` /
 * `auth.consentLogin` as in-place dialogs showing the legal document, so the
 * user never leaves the register/login flow.
 */
export const consentChunks = {
  terms: (chunks: ReactNode) => <LegalDialog namespace="terms">{chunks}</LegalDialog>,
  privacy: (chunks: ReactNode) => <LegalDialog namespace="privacy">{chunks}</LegalDialog>,
}
