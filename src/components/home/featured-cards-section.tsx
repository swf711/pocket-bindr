import { Badge } from '@/components/ui/badge'
import type { FeaturedCard } from '@/lib/homepage-queries'

interface FeaturedCardsSectionProps {
  cards: FeaturedCard[]
}

export function FeaturedCardsSection({ cards }: FeaturedCardsSectionProps) {
  if (cards.length === 0) return null

  return (
    <section className="py-12" data-testid="featured-cards-section">
      <h2 className="text-2xl font-semibold text-center mb-8">精選卡牌</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.id} className="flex flex-col items-center gap-2">
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <img
                src={card.imageSmall}
                alt={card.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center w-full">
              <p className="text-sm font-medium truncate">{card.name}</p>
              <p className="text-xs text-muted-foreground truncate">{card.setName}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {card.rarity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
