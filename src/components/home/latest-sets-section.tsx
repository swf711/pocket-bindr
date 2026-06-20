import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { LatestSet } from '@/lib/homepage-queries'

interface LatestSetsSectionProps {
  sets: LatestSet[]
}

const GAME_LABEL: Record<string, string> = {
  PTCG: 'Pokémon',
  OPCG: 'One Piece',
}

const LANG_LABEL: Record<string, string> = {
  EN: 'EN',
  JA: 'JA',
  ZH_TW: '繁中',
}

export function LatestSetsSection({ sets }: LatestSetsSectionProps) {
  if (sets.length === 0) return null

  return (
    <section className="py-12" data-testid="latest-sets-section">
      <h2 className="text-2xl font-semibold text-center mb-8">最新系列</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {sets.map((set) => (
          <Card key={set.id} className="overflow-hidden">
            <CardContent className="p-4 flex gap-3 items-center">
              <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-muted overflow-hidden">
                {set.symbolUrl ? (
                  <img
                    src={set.symbolUrl}
                    alt={set.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {set.externalId.slice(0, 4)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{set.name}</p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {GAME_LABEL[set.game] ?? set.game}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {LANG_LABEL[set.language] ?? set.language}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {set.releaseDate.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {set.totalCards} 張
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
