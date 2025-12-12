import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Citrus Candles - Orange, Lemon & Fresh Scents',
  description: 'Energize your space with our citrus-scented candles. Featuring bright orange, zesty lemon, and refreshing grapefruit fragrances. Hand-poured with natural soy wax.',
  keywords: [...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.scents.citrus],
  path: '/collections/candles/citrus',
});

export default function CitrusCandlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

