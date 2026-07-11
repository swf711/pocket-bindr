import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { LOCALES, type Locale } from "@/i18n/locale";
import { SITE_URL, OG_LOCALE } from "@/lib/og";
import { SessionProvider } from "@/components/providers/session-provider";
import { TanstackQueryProvider } from "@/components/providers/tanstack-query-provider";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const locale = (await getLocale()) as Locale;
  const title = t("title");
  const description = t("description");
  const ogLocale = OG_LOCALE[locale] ?? OG_LOCALE["zh-TW"];
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "PocketBindr",
      title,
      description,
      url: "/",
      locale: ogLocale,
      alternateLocale: LOCALES.map((l) => OG_LOCALE[l]).filter((l) => l !== ogLocale),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="PocketBindr" />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
        <TanstackQueryProvider>
          <SessionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                <Header />
                <main className="flex-1 flex flex-col min-h-0">
                  {children}
                </main>
                <Toaster richColors />
                <Analytics />
                <SpeedInsights />
              </TooltipProvider>
            </ThemeProvider>
          </SessionProvider>
        </TanstackQueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
