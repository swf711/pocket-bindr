import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function BinderNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">找不到卡冊</h1>
        <p className="text-muted-foreground">此分享連結無效或已被撤銷。</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">回首頁</Link>
      </Button>
    </div>
  )
}
