'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import type { ShowcaseCard } from '@/types/homepage'

interface StatsCarouselSectionProps {
  totalCards: number
  carouselCards: ShowcaseCard[]
}

export function StatsCarouselSection({ totalCards, carouselCards }: StatsCarouselSectionProps) {
  const [count, setCount] = useState(0)
  const [selectedCard, setSelectedCard] = useState<ShowcaseCard | null>(null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const sectionRef = useRef<HTMLDivElement>(null)
  const animatedRef = useRef(false)

  const handleApiChange = useCallback((api: CarouselApi) => {
    setCarouselApi(api)
  }, [])

  // Auto-scroll carousel
  useEffect(() => {
    if (!carouselApi) return
    const interval = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext()
      } else {
        carouselApi.scrollTo(0)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [carouselApi])

  // Number animation on section enter
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animatedRef.current) return
        animatedRef.current = true

        const duration = 2000
        const startTime = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * totalCards))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [totalCards])

  return (
    <section
      ref={sectionRef}
      className="min-h-screen snap-start flex flex-col justify-center gap-10 py-16"
      data-testid="stats-carousel-section"
    >
      {/* Stats text */}
      <div className="container mx-auto px-4 text-center">
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-2">
          平台即時同步所有系列
        </p>
        <div className="flex items-baseline justify-center gap-3 mb-4">
          <span
            className="text-7xl font-bold tabular-nums"
            data-testid="total-card-count"
          >
            {count.toLocaleString()}
          </span>
          <span className="text-2xl text-muted-foreground font-medium">張卡牌</span>
        </div>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">
          涵蓋 Pokémon TCG 與 One Piece TCG，繁中、日文、英文三語言持續更新
        </p>
      </div>

      {/* Full-width Carousel */}
      <div className="w-full" data-testid="homepage-carousel">
        <Carousel
          opts={{ align: 'start', loop: true }}
          setApi={handleApiChange}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {carouselCards.map((card) => (
              <CarouselItem
                key={card.id}
                className="pl-2 basis-[100px] sm:basis-[120px] md:basis-[140px]"
              >
                <button
                  type="button"
                  className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                  onClick={() => setSelectedCard(card)}
                  data-testid="carousel-card"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow hover:scale-105 transition-transform duration-200">
                    <img
                      src={card.imageSmall}
                      alt={card.zhName ?? card.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <CardDetailDrawer
        card={selectedCard}
        open={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        hideAddToBinder
      />
    </section>
  )
}
