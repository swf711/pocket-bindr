import { getTranslations } from 'next-intl/server'

interface LegalSection {
  heading: string
  body: string[]
  items?: string[]
}

interface LegalDocumentProps {
  namespace: 'privacy' | 'terms'
}

export async function LegalDocument({ namespace }: LegalDocumentProps) {
  const t = await getTranslations(namespace)
  const sections = t.raw('sections') as LegalSection[]
  const hasGoverningNotice = t.has('governingNotice')

  return (
    <article className="max-w-2xl mx-auto space-y-6" data-testid="legal-document">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('lastUpdatedLabel')}：{t('lastUpdated')}
        </p>
      </header>

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
