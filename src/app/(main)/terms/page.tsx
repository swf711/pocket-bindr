import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { LegalDocument } from '@/components/legal/legal-document'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms')
  return { title: t('title') }
}

export default function TermsPage() {
  return (
    <PageContainer>
      <LegalDocument namespace="terms" />
    </PageContainer>
  )
}
