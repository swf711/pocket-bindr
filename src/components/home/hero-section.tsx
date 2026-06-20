import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HeroSectionProps {
  isLoggedIn: boolean
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  return (
    <section className="py-16 text-center" data-testid="hero-section">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
        TCG Binder
      </h1>
      <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
        搜尋、收藏、整理你的集換式卡牌。建立專屬卡冊，隨時掌握收藏進度。
      </p>
      <div className="flex justify-center gap-3 flex-wrap">
        <Button asChild size="lg">
          <Link href="/cards">開始搜尋 →</Link>
        </Button>
        {isLoggedIn && (
          <Button asChild size="lg" variant="outline">
            <Link href="/binders">我的卡冊</Link>
          </Button>
        )}
      </div>
    </section>
  )
}
