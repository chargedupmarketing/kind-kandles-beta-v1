import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Our Mission - Do All Things With Kindness',
  description: 'Our mission is to spread kindness through handcrafted natural products. Learn about our commitment to quality, sustainability, and community.',
  keywords: [...SEO_KEYWORDS.general, 'mission statement', 'company values', 'kindness', 'sustainability'],
  path: '/about/mission',
});

export default function MissionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

