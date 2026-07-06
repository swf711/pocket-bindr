import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { HeroBinder } from './hero-binder'
import type { ShowcaseCard } from '@/types/homepage'
import Image from 'next/image'

interface HeroSectionProps {
  isLoggedIn: boolean
  cards: ShowcaseCard[]
}

export async function HeroSection({ isLoggedIn, cards }: HeroSectionProps) {
  const t = await getTranslations('home')
  return (
    <section
      className="h-screen snap-start flex items-start"
      data-testid="hero-section"
    >
      <div className="container mx-auto px-4 lg:px-16 pt-16 pb-12 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-2 overflow-visible gap-10 lg:gap-0">
          {/* Left: Text + CTA */}
          <div className="flex flex-col justify-center gap-4 text-center lg:text-left">
            <div>
              <Image
                src="/logo-light.svg"
                alt='logo'
                width={320}
                height={600}
                className="light:block dark:hidden w-sm sm:w-lg mx-auto lg:mx-0 mb-4"
              />
              <Image
                src="/logo-dark.svg"
                alt='logo'
                width={320}
                height={600}
                className="dark:block hidden w-sm sm:w-lg mx-auto lg:mx-0 mb-4"
              />
              <p className="text-muted-foreground text-lg mx-auto lg:mx-0">
                {t('tagline')}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
              <Button variant="default" size="lg" className="h-14 px-6 rounded-3xl" asChild>
                <Link href="/cards">{t('startSearch')}</Link>
              </Button>
              {isLoggedIn && (
                <Button variant="tertiary" size="lg" className="h-14 px-6 rounded-3xl" asChild>
                  <Link href="/binders">{t('myBinders')}</Link>
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('supports')}
            </p>
          </div>

          {/* Right: Interactive mini binder (tilt + drag handled inside HeroBinder) */}
          <div className="flex justify-center lg:justify-start overflow-visible">
            <div className="w-[85vw] lg:w-[40vw]">
              <HeroBinder cards={cards} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
