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
import JsonLd from "@/components/JsonLd";
import { generateOrganizationSchema, generateWebSiteSchema, SITE_CONFIG, SEO_KEYWORDS } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com'),
  title: {
    default: "My Kind Kandles & Boutique - Do All Things With Kindness",
    template: "%s | My Kind Kandles & Boutique",
  },
  description: "Natural handmade candles, skincare, body oils, and boutique items crafted with love in Owings Mills, Maryland. Promoting healthy skin with natural ingredients.",
  keywords: [...SEO_KEYWORDS.general, ...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.skincare].join(', '),
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  authors: [{ name: "My Kind Kandles & Boutique", url: SITE_CONFIG.url }],
  creator: "My Kind Kandles & Boutique",
  publisher: "My Kind Kandles & Boutique",
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  icons: {
    icon: [
      { url: '/logos/logo.ico', sizes: 'any' },
      { url: '/logos/logo.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/logos/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/logos/logo.ico',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_CONFIG.url,
    siteName: "My Kind Kandles & Boutique",
    title: "My Kind Kandles & Boutique - Do All Things With Kindness",
    description: "Natural handmade candles, skincare, body oils, and boutique items crafted with love in Owings Mills, Maryland. Promoting healthy skin with natural ingredients.",
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "My Kind Kandles & Boutique - Natural Handmade Products",
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Kind Kandles & Boutique - Do All Things With Kindness",
    description: "Natural handmade candles, skincare, body oils, and boutique items. Promoting healthy skin with natural ingredients.",
    images: [`${SITE_CONFIG.url}/og-image.svg`],
  },
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: 'shopping',
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#14b8a6',
  };
}

// Generate structured data for the entire site
const organizationSchema = generateOrganizationSchema();
const webSiteSchema = generateWebSiteSchema();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data for SEO */}
        <JsonLd data={organizationSchema} />
        <JsonLd data={webSiteSchema} />
        {/* Preconnect to external resources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
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