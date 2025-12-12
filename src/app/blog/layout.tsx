import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Blog - Tips, Guides & Inspiration',
  description: 'Explore our blog for candle care tips, skincare guides, gift ideas, and inspiration for natural living. Learn about the benefits of handmade products.',
  keywords: [...SEO_KEYWORDS.general, 'blog', 'candle tips', 'skincare guides', 'gift ideas', 'natural living'],
  path: '/blog',
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

