import type { Metadata, Viewport } from "next";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { Footer } from "@/src/components/layout/footer.tsx";
import { Header } from "@/src/components/layout/header.tsx";
import { Main } from "@/src/components/layout/main.tsx";
import { appConfig } from "@/src/config/index.ts";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: appConfig.app.name,
    template: `%s | ${appConfig.app.name}`,
  },
  description: appConfig.app.tagline,
  metadataBase: new URL(appConfig.app.url),
  robots: { index: false, follow: false },
  icons: {
    icon: { url: "/icon.svg", type: "image/svg" },
  },
  themeColor: "#ffffff",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body id="top">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:shadow-lg"
        >
          Skip to content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div id="root" className="flex min-h-dvh flex-col">
            <Header />
            <Main>{children}</Main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
