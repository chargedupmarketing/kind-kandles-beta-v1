import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS, generateArticleSchema, SITE_CONFIG } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'Candle Color Psychology - How Colors Affect Your Mood',
  description: 'Discover how candle colors influence your mood and atmosphere. Learn the psychology behind different colored candles and how to choose the right one for your space.',
  keywords: [...SEO_KEYWORDS.candles, 'color psychology', 'candle colors', 'mood lighting', 'aromatherapy'],
  path: '/blog/candles-color-psychology',
  type: 'article',
});

const articleSchema = generateArticleSchema({
  headline: 'Candle Color Psychology - How Colors Affect Your Mood',
  description: 'Discover how candle colors influence your mood and atmosphere.',
  image: `${SITE_CONFIG.url}/og-image.jpg`,
  url: `${SITE_CONFIG.url}/blog/candles-color-psychology`,
  datePublished: '2024-01-15T00:00:00Z',
});

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={articleSchema} />
      {children}
    </>
  );
}

