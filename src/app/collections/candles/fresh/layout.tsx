import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Fresh Candles - Clean, Crisp & Ocean Scents',
  description: 'Refresh your space with our clean-scented candles. Featuring crisp linen, ocean breeze, and rain-inspired fragrances. Hand-poured with natural soy wax.',
  keywords: [...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.scents.fresh],
  path: '/collections/candles/fresh',
});

export default function FreshCandlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

