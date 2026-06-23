import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroBinder } from './hero-binder'
import type { ShowcaseCard } from '@/types/homepage'

interface HeroSectionProps {
  isLoggedIn: boolean
  cards: ShowcaseCard[]
}

export function HeroSection({ isLoggedIn, cards }: HeroSectionProps) {
  return (
    <section
      className="h-screen snap-start flex items-start"
      data-testid="hero-section"
    >
      <div className="container mx-auto px-16 pt-16 pb-12 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-2 overflow-visible">
          {/* Left: Text + CTA */}
          <div className="flex flex-col justify-center gap-6 text-center lg:text-left">
            <div>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-4">
                TCG Binder
              </h1>
              <p className="text-muted-foreground text-lg mx-auto lg:mx-0">
                搜尋、收藏、整理你的集換式卡牌。建立專屬卡冊，隨時掌握收藏進度。
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
              <Button asChild size="lg">
                <Link href="/cards">開始搜尋 →</Link>
              </Button>
              {isLoggedIn && (
                <Button asChild size="lg" variant="outline">
                  <Link href="/binders">我的卡冊</Link>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              支援 Pokémon TCG・One Piece TCG・繁中／日文／英文
            </p>
          </div>

          {/* Right: Interactive mini binder (tilt + drag handled inside HeroBinder) */}
          <div className="flex justify-center lg:justify-start overflow-visible">
            <div className="w-[85vw] lg:w-[40vw]">
              <HeroBinder cards={cards} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
