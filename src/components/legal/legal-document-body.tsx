'use client'

import { useTranslations } from 'next-intl'

interface LegalSection {
  heading: string
  body: string[]
  items?: string[]
}

interface LegalDocumentBodyProps {
  namespace: 'privacy' | 'terms'
  /** Suppress the internal title/lastUpdated header (used when a host renders its own fixed header, e.g. LegalDialog). */
  hideHeader?: boolean
}

/**
 * Client-side renderer for the legal documents. Shared by the standalone
 * /terms & /privacy pages (via the server `LegalDocument` wrapper) and the
 * in-place `LegalDialog`. Reads the same next-intl messages the pages use —
 * the root layout injects full messages into NextIntlClientProvider, so
 * `useTranslations` + `t.raw('sections')` resolve identically on the client.
 */
export function LegalDocumentBody({ namespace, hideHeader = false }: LegalDocumentBodyProps) {
  const t = useTranslations(namespace)
  const sections = t.raw('sections') as LegalSection[]
  const hasGoverningNotice = t.has('governingNotice')

  return (
    <article className="max-w-2xl mx-auto space-y-6" data-testid="legal-document">
      {!hideHeader && (
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('lastUpdatedLabel')}：{t('lastUpdated')}
          </p>
        </header>
      )}

      {hasGoverningNotice && (
        <p className="text-sm text-muted-foreground border rounded-md p-4 bg-muted/50">
          {t('governingNotice')}
        </p>
      )}

      <p className="text-sm">{t('intro')}</p>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-xl font-semibold">{section.heading}</h2>
            {section.body.map((paragraph, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {paragraph}
              </p>
            ))}
            {section.items && (
              <ul className="list-disc pl-6 space-y-1">
                {section.items.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  )
}
