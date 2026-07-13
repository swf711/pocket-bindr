import { Fragment } from 'react'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { CardBreadcrumbItem } from '@/lib/card-jsonld'

/**
 * 卡片獨立頁可見麵包屑。items 與 JSON-LD BreadcrumbList 共用同一份資料（page.tsx 算一次），
 * 避免可見內容與 markup 漂移。末節（自身）render 為 BreadcrumbPage，無連結。
 */
export function CardBreadcrumb({ items }: { items: CardBreadcrumbItem[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.name}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
