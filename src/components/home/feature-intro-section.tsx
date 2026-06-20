import { BookOpen, Library, Search } from 'lucide-react'
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

export function FeatureIntroSection() {
  return (
    <section className="py-12" data-testid="feature-intro-section">
      <h2 className="text-2xl font-semibold text-center mb-8">平台功能</h2>
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
    </section>
  )
}
