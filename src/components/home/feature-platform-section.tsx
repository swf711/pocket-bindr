import { BookOpen, Laptop2, Library, Search, Share2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Search,
    title: '搜尋卡牌',
    description: '支援 PTCG、OPCG 多語言卡牌搜尋，依系列、稀有度快速找到目標卡牌。',
  },
  {
    icon: BookOpen,
    title: '建立卡冊',
    description: '自訂格式與封面，將收藏整理成精美的虛擬卡冊，支援拖拉排序。',
  },
  {
    icon: Library,
    title: '管理收藏',
    description: '標記擁有或想要的卡牌，追蹤每個系列的收集進度，支援各式尺寸卡冊。',
  },
  {
    icon: Laptop2,
    title: '不限裝置同步整理',
    description: '帳號資料雲端同步，隨時隨地在任何裝置上整理你的收藏。',
  },
  {
    icon: Share2,
    title: '分享你的卡冊',
    description: '建立卡冊連結，輕鬆與好友分享你的收藏。（即將推出）',
  },
  {
    icon: Sparkles,
    title: '更多功能即將推出',
    description: '持續開發中，敬請期待更多實用功能。',
  },
]

export function FeaturePlatformSection() {
  return (
    <section
      className="min-h-screen snap-start flex flex-col items-center justify-center py-16 px-4"
      data-testid="feature-platform-section"
    >
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">平台功能</h2>
          <p className="text-muted-foreground mt-2">所有你需要的卡牌收藏工具，一站搞定</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </section>
  )
}
