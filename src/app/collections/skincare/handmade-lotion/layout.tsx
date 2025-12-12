import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Handmade Lotion - Natural Moisturizing Cream',
  description: 'Silky smooth handmade lotions that absorb quickly and moisturize deeply. Made with natural ingredients for healthy, hydrated skin.',
  keywords: [...SEO_KEYWORDS.skincare, 'handmade lotion', 'natural moisturizer', 'body lotion', 'skin hydration'],
  path: '/collections/skincare/handmade-lotion',
});

export default function HandmadeLotionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

