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
      className="min-h-screen snap-start flex items-center"
      data-testid="hero-section"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text + CTA */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <div>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-4">
                TCG Binder
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto lg:mx-0">
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

          {/* Right: Interactive mini binder */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-xs">
              <HeroBinder cards={cards} />
              <p className="text-xs text-center text-muted-foreground mt-2">
                拖拉卡牌來重新排列 ↕
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
