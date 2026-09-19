import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LOCALES, isLocale, type Locale } from "@/i18n/locale";
import { SITE_URL, OG_LOCALE, HOME_OG_IMAGE_PATH, ogImageMetadata } from "@/lib/og";
import { SessionProvider } from "@/components/providers/session-provider";
import { TanstackQueryProvider } from "@/components/providers/tanstack-query-provider";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";
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

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type LayoutParams = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LayoutParams): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "zh-TW";
  const t = await getTranslations({ locale, namespace: "metadata" });
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
      images: ogImageMetadata(HOME_OG_IMAGE_PATH),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageMetadata(HOME_OG_IMAGE_PATH),
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
}> & LayoutParams) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
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
