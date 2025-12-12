import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'All Candles - Complete Handcrafted Candle Collection',
  description: 'Browse our complete collection of hand-poured soy candles. From citrus to woodsy, floral to sweet - find your perfect scent. Made with natural ingredients.',
  keywords: [...SEO_KEYWORDS.candles, 'all candles', 'candle collection', 'scented candles'],
  path: '/collections/candles/all',
});

export default function AllCandlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

