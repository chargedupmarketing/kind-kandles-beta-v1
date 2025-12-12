import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Woodsy Candles - Cedar, Pine & Forest Scents',
  description: 'Escape to the forest with our woodsy-scented candles. Featuring warm cedar, fresh pine, and earthy sandalwood fragrances. Hand-poured with natural soy wax.',
  keywords: [...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.scents.woodsy],
  path: '/collections/candles/woodsy',
});

export default function WoodsyCandlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

