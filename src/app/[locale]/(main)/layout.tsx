import { Footer } from '@/components/layout/footer'
import { CommandPalette } from '@/components/command/command-palette'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
      <CommandPalette />
    </>
  )
}
