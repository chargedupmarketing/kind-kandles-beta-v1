import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Herbal Candles - Sage, Eucalyptus & Mint Scents',
  description: 'Rejuvenate your senses with our herbal-scented candles. Featuring cleansing sage, refreshing eucalyptus, and cool mint fragrances. Hand-poured with natural soy wax.',
  keywords: [...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.scents.herbal],
  path: '/collections/candles/herbal',
});

export default function HerbalCandlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

