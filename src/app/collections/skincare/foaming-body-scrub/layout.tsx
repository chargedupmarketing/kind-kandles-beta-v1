import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Foaming Body Scrub - Exfoliating & Cleansing',
  description: 'Gentle foaming body scrub that exfoliates and cleanses in one step. Removes dead skin cells for smooth, radiant skin. Made with natural ingredients.',
  keywords: [...SEO_KEYWORDS.skincare, 'foaming scrub', 'body exfoliant', 'skin exfoliation', 'dead skin removal'],
  path: '/collections/skincare/foaming-body-scrub',
});

export default function FoamingBodyScrubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

