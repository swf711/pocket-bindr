import { getTranslations, setRequestLocale } from 'next-intl/server'
import { toParamLocale } from '@/i18n/locale'
import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { LegalDocument } from '@/components/legal/legal-document'

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = toParamLocale((await params).locale)
  const t = await getTranslations({ locale, namespace: 'terms' })
  return { title: t('title') }
}

// Static rendering: setRequestLocale lets next-intl skip reading request headers.
export default async function TermsPage({ params }: PageProps) {
  setRequestLocale(toParamLocale((await params).locale))
  return (
    <PageContainer>
      <LegalDocument namespace="terms" />
    </PageContainer>
  )
}
