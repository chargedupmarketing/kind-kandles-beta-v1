import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ErrorBoundary from "@/components/ErrorBoundary";
import { DarkModeProvider } from "@/contexts/DarkModeContext";
import { BannerProvider } from "@/contexts/BannerContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { CartProvider } from "@/contexts/CartContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com'),
  title: "My Kind Kandles & Boutique - Do All Things With Kindness",
  description: "Natural handmade candles, skincare, body oils, and boutique items. Promoting healthy skin with natural ingredients.",
  keywords: "candles, skincare, body butter, natural ingredients, handmade, boutique",
  manifest: "/manifest.json",
  robots: "index, follow",
  authors: [{ name: "My Kind Kandles & Boutique" }],
  creator: "My Kind Kandles & Boutique",
  publisher: "My Kind Kandles & Boutique",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kindkandlesboutique.com",
    siteName: "My Kind Kandles & Boutique",
    title: "My Kind Kandles & Boutique - Do All Things With Kindness",
    description: "Natural handmade candles, skincare, body oils, and boutique items. Promoting healthy skin with natural ingredients.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "My Kind Kandles & Boutique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Kind Kandles & Boutique - Do All Things With Kindness",
    description: "Natural handmade candles, skincare, body oils, and boutique items. Promoting healthy skin with natural ingredients.",
    images: ["/og-image.jpg"],
  },
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#14b8a6',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AdminProvider>
            <DarkModeProvider>
              <BannerProvider>
                <CartProvider>
                  <ClientLayout>
                    {children}
                  </ClientLayout>
                </CartProvider>
              </BannerProvider>
            </DarkModeProvider>
          </AdminProvider>
        </ErrorBoundary>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}