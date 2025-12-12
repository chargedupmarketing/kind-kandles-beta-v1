import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Floral Candles - Rose, Lavender & Garden Scents',
  description: 'Bring the garden indoors with our floral-scented candles. Featuring romantic rose, calming lavender, and fresh jasmine fragrances. Hand-poured with natural soy wax.',
  keywords: [...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.scents.floral],
  path: '/collections/candles/floral',
});

export default function FloralCandlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

