import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS, generateArticleSchema, SITE_CONFIG } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'How Scents Trigger Emotions - The Science of Aromatherapy',
  description: 'Learn how different scents trigger emotions and memories. Understand the science behind aromatherapy and how to use candles for emotional wellness.',
  keywords: [...SEO_KEYWORDS.candles, 'aromatherapy', 'scent emotions', 'fragrance psychology', 'emotional wellness'],
  path: '/blog/emotions-are-triggered-by-what',
  type: 'article',
});

const articleSchema = generateArticleSchema({
  headline: 'How Scents Trigger Emotions - The Science of Aromatherapy',
  description: 'Learn how different scents trigger emotions and memories.',
  image: `${SITE_CONFIG.url}/og-image.jpg`,
  url: `${SITE_CONFIG.url}/blog/emotions-are-triggered-by-what`,
  datePublished: '2024-02-01T00:00:00Z',
});

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={articleSchema} />
      {children}
    </>
  );
}

