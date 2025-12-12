import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Body Spray Mist - Refreshing Natural Fragrance',
  description: 'Lightweight body spray mists with natural fragrances. Perfect for a quick refresh throughout the day. Made with essential oils and gentle ingredients.',
  keywords: [...SEO_KEYWORDS.skincare, 'body spray', 'body mist', 'natural fragrance', 'refreshing spray'],
  path: '/collections/skincare/body-spray-mist',
});

export default function BodySprayMistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

