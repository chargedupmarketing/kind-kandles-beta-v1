import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Sweet Candles - Vanilla, Bakery & Dessert Scents',
  description: 'Indulge in our sweet-scented candles. Featuring warm vanilla, fresh-baked cookies, and delicious dessert fragrances. Hand-poured with natural soy wax.',
  keywords: [...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.scents.sweet],
  path: '/collections/candles/sweet',
});

export default function SweetCandlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

