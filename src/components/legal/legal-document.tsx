import { LegalDocumentBody } from '@/components/legal/legal-document-body'

interface LegalDocumentProps {
  namespace: 'privacy' | 'terms'
}

/**
 * Server wrapper kept for the /terms & /privacy pages (and existing tests).
 * Rendering lives in the client `LegalDocumentBody` so the same markup is
 * reused by the in-place consent `LegalDialog`.
 */
export function LegalDocument({ namespace }: LegalDocumentProps) {
  return <LegalDocumentBody namespace={namespace} />
}
