import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Handcrafted Soy Candles - Natural & Eco-Friendly',
  description: 'Discover our collection of hand-poured soy candles made with premium essential oils. Clean burning, long-lasting, and beautifully scented. Shop citrus, floral, woodsy, and more.',
  keywords: [...SEO_KEYWORDS.candles, 'soy wax candles', 'aromatherapy', 'home fragrance'],
  path: '/collections/candles',
});

export default function CandlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

