import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'FAQ - Frequently Asked Questions',
  description: 'Find answers to common questions about our handmade candles, skincare products, shipping, returns, and custom orders at My Kind Kandles & Boutique.',
  keywords: [...SEO_KEYWORDS.general, 'FAQ', 'frequently asked questions', 'help', 'customer support'],
  path: '/faq',
});

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

