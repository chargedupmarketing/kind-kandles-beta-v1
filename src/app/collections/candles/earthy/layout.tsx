import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Earthy Candles - Sandalwood, Patchouli & Musk Scents',
  description: 'Ground yourself with our earthy-scented candles. Featuring warm sandalwood, rich patchouli, and sensual musk fragrances. Hand-poured with natural soy wax.',
  keywords: [...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.scents.earthy],
  path: '/collections/candles/earthy',
});

export default function EarthyCandlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

