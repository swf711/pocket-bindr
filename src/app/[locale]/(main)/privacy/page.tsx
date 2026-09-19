import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { LegalDocument } from '@/components/legal/legal-document'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy')
  return { title: t('title') }
}

export default function PrivacyPage() {
  return (
    <PageContainer>
      <LegalDocument namespace="privacy" />
    </PageContainer>
  )
}
