'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

/**
 * 未登入訪客轉化 CTA — 公開分享頁右下角浮動按鈕（M3 extended FAB）。
 * 採 fixed 定位、不佔版面高度（不壓縮 Snowglobe 卡冊區）。
 * M3 規格：~56dp 高、24dp 圖示、elevation（shadow）；用 tertiary 角色作刻意強調。
 * 僅對未登入訪客渲染（由 BinderPublicView 依 isAuthenticated 控制）。
 */
export function PublicShareCta() {
  const t = useTranslations('binder')

  return (
    <div
      data-testid="public-share-cta"
      className="fixed right-4 bottom-20 z-30 md:right-8 md:bottom-8"
    >
      <Button
        asChild
        variant="tertiary"
        size="lg"
        className="h-14 gap-2 px-5 text-base shadow-lg"
      >
        <Link href="/register" data-testid="public-share-cta-register">
          <Plus className="size-6" />
          {t('publicView.ctaButton')}
        </Link>
      </Button>
    </div>
  )
}
