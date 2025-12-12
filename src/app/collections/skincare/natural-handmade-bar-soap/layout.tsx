import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Natural Handmade Bar Soap - Gentle & Nourishing',
  description: 'Artisan handmade bar soaps crafted with natural oils and butters. Gentle cleansing without harsh chemicals. Perfect for sensitive skin.',
  keywords: [...SEO_KEYWORDS.skincare, 'handmade soap', 'natural bar soap', 'artisan soap', 'gentle cleanser'],
  path: '/collections/skincare/natural-handmade-bar-soap',
});

export default function NaturalBarSoapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

