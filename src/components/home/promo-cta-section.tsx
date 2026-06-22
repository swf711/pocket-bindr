import Link from 'next/link'
import { Users, Sparkles, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Users,
    title: '一人獨立開發',
    description: '由熱愛卡牌遊戲的獨立開發者打造，持續更新完善中。',
  },
  {
    icon: Sparkles,
    title: '完全免費使用',
    description: '所有核心功能完全免費，無廣告、無付費牆。',
  },
  {
    icon: BookOpen,
    title: '加入會員解鎖收藏',
    description: '登入即可標記擁有／想要的卡牌，建立專屬卡冊。',
  },
]

interface PromoCTASectionProps {
  isLoggedIn: boolean
}

export function PromoCTASection({ isLoggedIn }: PromoCTASectionProps) {
  return (
    <section className="py-12" data-testid="promo-cta-section">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">為什麼選擇 TCG Binder？</h2>
        <p className="text-muted-foreground">用最簡單的方式管理你的卡牌收藏</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/cards">開始搜尋 →</Link>
        </Button>
        {isLoggedIn && (
          <Button asChild variant="outline" size="lg">
            <Link href="/binders">我的卡冊</Link>
          </Button>
        )}
      </div>
    </section>
  )
}
