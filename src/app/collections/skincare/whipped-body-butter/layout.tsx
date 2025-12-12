import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Whipped Body Butter - Deep Moisturizing Skincare',
  description: 'Luxuriously creamy whipped body butter for deep hydration. Made with natural shea butter and nourishing oils. Perfect for dry skin and daily moisturizing.',
  keywords: [...SEO_KEYWORDS.skincare, 'whipped body butter', 'shea butter', 'deep moisturizer', 'dry skin remedy'],
  path: '/collections/skincare/whipped-body-butter',
});

export default function WhippedBodyButterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

