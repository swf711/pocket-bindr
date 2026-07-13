import Link from 'next/link'
import { Mail } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { FooterContent } from '@/components/layout/footer-content'
import { GitHubIcon } from '@/components/icons/provider-icons'

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  )
}

export async function WhySection() {
  const t = await getTranslations('home')
  return (
    <section
      className="min-h-screen snap-start flex flex-col"
      data-testid="why-section"
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-8 container mx-auto px-4 py-16 text-center">
        <Avatar className='size-32'>
          <AvatarImage
            src="https://github.com/swf711.png"
            alt="@swf711"
          />
          <AvatarFallback>BR</AvatarFallback>
        </Avatar>

        <div className="space-y-4 max-w-xl">
          <h2 className="text-3xl font-bold">{t('aboutTitle')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('aboutBody')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center" data-testid="about-links">
          <Button asChild variant="secondary" size="lg" className="h-14 has-[>svg]:px-6 rounded-3xl">
            <Link
              href="https://www.linkedin.com/in/swf711/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkedInIcon className="mr-2 size-4" />
              LinkedIn
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="h-14 has-[>svg]:px-6 rounded-3xl">
            <Link
              href="https://github.com/swf711"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon className="mr-2 size-4" />
              GitHub
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="h-14 has-[>svg]:px-6 rounded-3xl">
            <Link href="mailto:support@pocketbindr.app">
              <Mail className="mr-2 size-4" />
              Email
            </Link>
          </Button>
        </div>
      </div>

      {/* Inline footer — 內容與全站 Footer 共用，見 FooterContent（避免兩處漂移） */}
      <footer className="shrink-0 border-t py-6" data-testid="inline-footer">
        <FooterContent />
      </footer>
    </section>
  )
}
