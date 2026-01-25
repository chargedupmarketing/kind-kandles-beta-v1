import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com';

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: '', priority: 1.0, changeFrequency: 'daily' as const },
  { path: '/collections/all', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/collections/candles', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/collections/candles/all', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/collections/candles/citrus', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/candles/floral', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/candles/fresh', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/candles/sweet', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/candles/woodsy', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/candles/herbal', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/candles/earthy', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/skincare', priority: 0.9, changeFrequency: 'daily' as const },
  { path: '/collections/skincare/whipped-body-butter', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/skincare/foaming-body-scrub', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/skincare/natural-handmade-bar-soap', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/skincare/body-spray-mist', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/skincare/handmade-lotion', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/body-oils', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/collections/hair-oils', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/room-sprays', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/collections/clothing-accessories', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/collections/calm-down-girl', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/about/mission', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/about/contact', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/about/refund-policy', priority: 0.5, changeFrequency: 'yearly' as const },
  { path: '/faq', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/customs', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/events', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/write-your-story', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/blog/candles-color-psychology', priority: 0.6, changeFrequency: 'yearly' as const },
  { path: '/blog/emotions-are-triggered-by-what', priority: 0.6, changeFrequency: 'yearly' as const },
  { path: '/blog/the-thoughtful-gift-that-always-wins', priority: 0.6, changeFrequency: 'yearly' as const },
];

async function getProductPages(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('handle, updated_at')
      .eq('status', 'active');

    if (error || !products) {
      console.error('Error fetching products for sitemap:', error);
      return [];
    }

    return products.map((product) => ({
      url: `${baseUrl}/products/${product.handle}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error generating product sitemap:', error);
    return [];
  }
}

async function getEventPages(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (error || !events) {
      console.error('Error fetching events for sitemap:', error);
      return [];
    }

    return events.map((event) => ({
      url: `${baseUrl}/events/${event.slug}`,
      lastModified: event.updated_at ? new Date(event.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error generating event sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Generate static page entries
  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Get dynamic product pages
  const productEntries = await getProductPages();

  // Get dynamic event pages
  const eventEntries = await getEventPages();

  return [...staticEntries, ...productEntries, ...eventEntries];
}

