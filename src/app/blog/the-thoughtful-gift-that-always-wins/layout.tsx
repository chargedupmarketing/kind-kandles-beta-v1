import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS, generateArticleSchema, SITE_CONFIG } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'The Thoughtful Gift That Always Wins - Candle Gift Guide',
  description: 'Why candles make the perfect gift for any occasion. Discover thoughtful gift ideas and how to choose the right candle for birthdays, holidays, and special moments.',
  keywords: [...SEO_KEYWORDS.candles, 'candle gifts', 'gift guide', 'thoughtful gifts', 'holiday gifts', 'birthday gifts'],
  path: '/blog/the-thoughtful-gift-that-always-wins',
  type: 'article',
});

const articleSchema = generateArticleSchema({
  headline: 'The Thoughtful Gift That Always Wins - Candle Gift Guide',
  description: 'Why candles make the perfect gift for any occasion.',
  image: `${SITE_CONFIG.url}/og-image.jpg`,
  url: `${SITE_CONFIG.url}/blog/the-thoughtful-gift-that-always-wins`,
  datePublished: '2024-03-01T00:00:00Z',
});

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={articleSchema} />
      {children}
    </>
  );
}

