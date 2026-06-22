import Link from 'next/link'
import { BookOpen, Library, Search, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Search,
    title: '搜尋卡牌',
    description: '支援 PTCG、OPCG 多語言卡牌搜尋，依系列、稀有度快速找到目標卡牌。',
  },
  {
    icon: Library,
    title: '管理收藏',
    description: '標記擁有或想要的卡牌，追蹤每個系列的收集進度。',
  },
  {
    icon: BookOpen,
    title: '建立卡冊',
    description: '自訂格式與封面，將收藏整理成精美的虛擬卡冊，支援拖拉排序。',
  },
]

const REASONS = [
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

interface WhySectionProps {
  isLoggedIn: boolean
}

export function WhySection({ isLoggedIn }: WhySectionProps) {
  return (
    <section
      className="min-h-screen snap-start flex flex-col"
      data-testid="why-section"
    >
      <div className="flex-1 flex flex-col justify-center gap-12 container mx-auto px-4 py-16">
        {/* Platform features */}
        <div>
          <h2 className="text-2xl font-semibold text-center mb-6">平台功能</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why TCG Binder */}
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-1">為什麼選擇 TCG Binder？</h2>
            <p className="text-muted-foreground text-sm">用最簡單的方式管理你的卡牌收藏</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {REASONS.map(({ icon: Icon, title, description }) => (
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
        </div>
      </div>

      {/* Inline footer */}
      <footer className="shrink-0 border-t py-6" data-testid="inline-footer">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © 2026 TCG Binder, All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            本站與 Nintendo、The Pokémon Company、Bandai 及相關商標持有人無任何關聯。
            卡牌圖片版權歸原版權方所有，僅供收藏整理參考用途。
          </p>
        </div>
      </footer>
    </section>
  )
}
