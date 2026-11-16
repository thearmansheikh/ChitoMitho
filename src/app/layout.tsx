import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomBar from "@/components/BottomBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chitto Mitho | Delivery in Dharan",
  description:
    "Food, groceries, liquor, gifts & flowers, parcels and anything from anywhere, delivered in Dharan, Itahari and Biratnagar.",
  applicationName: "Chitto Mitho",
  appleWebApp: { capable: true, title: "Chitto Mitho", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#2E5A9C", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="bg-white text-ink antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
          <Footer />
          <BottomBar />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
