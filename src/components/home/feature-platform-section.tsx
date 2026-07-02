import { BookOpen, Laptop2, Library, Search, Share2, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  { key: 'search', icon: Search },
  { key: 'binder', icon: BookOpen },
  { key: 'collection', icon: Library },
  { key: 'sync', icon: Laptop2 },
  { key: 'share', icon: Share2 },
  { key: 'more', icon: Sparkles },
] as const

export async function FeaturePlatformSection() {
  const t = await getTranslations('home')
  return (
    <section
      className="min-h-screen snap-start flex flex-col items-center justify-center py-16 px-4"
      data-testid="feature-platform-section"
    >
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">{t('featuresTitle')}</h2>
          <p className="text-muted-foreground mt-2">{t('featuresSubtitle')}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, key }) => (
            <Card key={key} className="[--card-spacing:--spacing(3)] sm:[--card-spacing:--spacing(6)] bg-tertiary-container text-on-tertiary-container">
              <CardHeader>
                <CardTitle>
                  <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-5">
                    <Icon className="text-primary size-4" />
                    <CardTitle className="text-lg">{t(`features.${key}.title`)}</CardTitle>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t(`features.${key}.description`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
