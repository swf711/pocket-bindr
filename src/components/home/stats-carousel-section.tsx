'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { CardDetailDrawer } from '@/components/cards/card-detail-drawer'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import type { ShowcaseCard } from '@/types/homepage'
import { Eye } from 'lucide-react'

interface StatsCarouselSectionProps {
  totalCards: number
  carouselCards: ShowcaseCard[]
}

export function StatsCarouselSection({ totalCards, carouselCards }: StatsCarouselSectionProps) {
  const [count, setCount] = useState(0)
  const [selectedCard, setSelectedCard] = useState<ShowcaseCard | null>(null)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const statsRef = useRef<HTMLDivElement>(null)
  const animatedRef = useRef(false)
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()
  const outerRef = useRef<HTMLElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const coverLayerRef = useRef<HTMLDivElement>(null)

  // Direct DOM animation — bypasses React re-renders for 60fps smoothness
  useEffect(() => {
    if (isMobile || reducedMotion) return
    const outer = outerRef.current
    const textEl = textLayerRef.current
    const coverEl = coverLayerRef.current
    if (!outer || !textEl || !coverEl) return

    let raf = 0
    const update = () => {
      raf = 0
      const travel = outer.offsetHeight - window.innerHeight
      if (travel <= 0) return
      const p = Math.min(Math.max(-outer.getBoundingClientRect().top / travel, 0), 1)
      textEl.style.transform = `translate3d(0, ${-p * 16}px, 0)`
      textEl.style.opacity = String(Math.min(Math.max(1 - (p - 0.5) / 0.4, 0), 1))
      coverEl.style.transform = `translate3d(0, ${(1 - p) * 100}%, 0)`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [isMobile, reducedMotion])

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

  // Number animation when the stats block enters the viewport
  useEffect(() => {
    const el = statsRef.current
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
        observer.disconnect()
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [totalCards])

  const statsContent = (
    <div ref={statsRef} className="container mx-auto px-4 text-center">
      <p className="text-muted-foreground text-sm uppercase tracking-widest mb-2">
        平台即時同步所有系列
      </p>
      <div className="flex items-baseline justify-center gap-3 mb-4">
        <span className="text-7xl font-bold tabular-nums" data-testid="total-card-count">
          {count.toLocaleString()}
        </span>
        <span className="text-2xl text-muted-foreground font-medium">張卡牌</span>
      </div>
      <p className="text-muted-foreground text-base mx-auto">
        涵蓋 Pokémon TCG 與 One Piece TCG，繁中、日文、英文三語言持續更新
      </p>
    </div>
  )

  // Large-image showcase carousel (covers the stats text on scroll)
  const carouselContent = (
    <div className="w-full" data-testid="homepage-carousel">
      <Carousel opts={{ align: 'center', loop: true }} setApi={handleApiChange} className="w-full [&_.overflow-hidden]:overflow-visible">
        <CarouselContent className="-ml-3">
          {carouselCards.map((card) => (
            <CarouselItem key={card.id} className="pl-3 basis-auto">
              <button
                type="button"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl block"
                onClick={() => setSelectedCard(card)}
                data-testid="carousel-card"
              >
                <img
                  src={card.imageSmall}
                  alt={card.zhName ?? card.name}
                  className="h-[45vh] w-auto object-contain rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
                />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex justify-center items-center gap-1 text-muted-foreground mt-3">
        <span>點擊卡牌來詳細檢視</span>
        <Eye className="size-4" />
      </div>
    </div>
  )

  const drawer = (
    <CardDetailDrawer
      card={selectedCard}
      open={selectedCard !== null}
      onClose={() => setSelectedCard(null)}
      hideAddToBinder
    />
  )

  // Mobile / reduced-motion: two static snap pages stacked, no sticky parallax
  if (isMobile || reducedMotion) {
    return (
      <div data-testid="stats-carousel-section">
        <section className="h-screen snap-start flex flex-col justify-center py-16">
          {statsContent}
        </section>
        <section className="h-screen snap-start flex flex-col justify-center py-16">
          {carouselContent}
        </section>
        {drawer}
      </div>
    )
  }

  // Desktop: sticky pinned parallax — carousel slides up from below to cover the stats text.
  // Animation driven by direct DOM ref mutation (no React re-renders) for smooth 60fps.
  // 300vh outer gives ample scroll travel; proximity snap settles at top-0 or top-[200vh].
  return (
    <section ref={outerRef} data-testid="stats-carousel-section" className="relative h-[300vh]">
      {/* snap anchors：top:0（文字）與 top:200vh（carousel 完全覆蓋）兩個停點 */}
      <div className="absolute top-0 left-0 h-px w-full snap-start" aria-hidden />
      <div className="absolute top-[200vh] left-0 h-px w-full snap-start" aria-hidden />

      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        {/* 文字層：初始位置由 useEffect 控制，will-change 啟用 GPU 合成層 */}
        <div ref={textLayerRef} style={{ willChange: 'transform' }}>
          {statsContent}
        </div>

        {/* carousel 層：初始在畫面下方（translate 100%），由 useEffect 上滑覆蓋 */}
        <div
          ref={coverLayerRef}
          className="absolute inset-0 z-10 flex flex-col justify-center"
          style={{ transform: 'translate3d(0, 100%, 0)', willChange: 'transform' }}
        >
          {carouselContent}
        </div>
      </div>

      {drawer}
    </section>
  )
}
