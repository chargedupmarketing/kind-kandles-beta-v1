import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Write Your Story - Share Your Experience',
  description: 'Share your Kind Kandles experience with us. We love hearing how our products have touched your life. Submit your story and be featured.',
  keywords: [...SEO_KEYWORDS.general, 'customer stories', 'testimonials', 'reviews', 'share experience'],
  path: '/write-your-story',
});

export default function WriteYourStoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

