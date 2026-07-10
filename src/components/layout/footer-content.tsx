'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { ReportDialog } from '@/components/report/report-dialog'
import { GitHubIcon } from '@/components/icons/provider-icons'

/**
 * 全站 footer 內容（logo/rights/disclaimer/terms/privacy/report），
 * 供 Footer（全站 wrapper）與首頁 WhySection（inline snap footer）共用，
 * 避免兩處內容各自維護導致漂移。
 */
export function FooterContent() {
  const t = useTranslations('footer')
  const tReport = useTranslations('report')
  const { data: session } = useSession()

  return (
    <div className="container mx-auto px-4 text-center space-y-2">
      <Image
        src="/logo-light.svg"
        alt='logo'
        width={150}
        height={100}
        className="light:block dark:hidden mx-auto"
      />
      <Image
        src="/logo-dark.svg"
        alt='logo'
        width={150}
        height={100}
        className="dark:block hidden mx-auto"
      />
      <p className="text-sm text-muted-foreground">
        {t('rights')}
      </p>
      <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
        {t('disclaimer')}
      </p>
      <p className="text-xs text-muted-foreground">
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </p>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:underline">
          {t('terms')}
        </Link>
        <Link href="/privacy" className="hover:underline">
          {t('privacy')}
        </Link>
        <a
          href="https://github.com/swf711/pocket-bindr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:underline"
        >
          <GitHubIcon className="size-3.5" />
          GitHub
        </a>
        {session?.user && (
          <ReportDialog
            trigger={
              <button type="button" data-testid="footer-report-trigger" className="hover:underline cursor-pointer">
                {tReport('trigger')}
              </button>
            }
          />
        )}
      </div>
    </div>
  )
}
