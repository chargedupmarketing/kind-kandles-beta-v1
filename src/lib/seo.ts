/**
 * SEO Utilities and Schema.org JSON-LD Generators
 * 
 * Provides reusable metadata generation functions and structured data helpers
 * for maximizing search visibility and click-through rates.
 */

import { Metadata } from 'next';

// Site configuration
export const SITE_CONFIG = {
  name: 'My Kind Kandles & Boutique',
  shortName: 'Kind Kandles',
  tagline: 'Do All Things With Kindness',
  description: 'Natural handmade candles, skincare, body oils, and boutique items. Promoting healthy skin with natural ingredients.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://kindkandlesboutique.com',
  logo: '/logos/logo.png',
  ogImage: '/og-image.svg', // Replace with /og-image.jpg when you have a branded image
  themeColor: '#14b8a6',
  locale: 'en_US',
  // Business info
  address: {
    streetAddress: '',
    addressLocality: '',
    addressRegion: 'MD',
    postalCode: '',
    addressCountry: 'US',
  },
  phone: '', // Add phone number when available
  email: 'info@kindkandlesboutique.com',
  // Social media (add when available)
  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    pinterest: '',
    tiktok: '',
  },
};

// Keywords by category for SEO optimization
export const SEO_KEYWORDS = {
  general: [
    'handmade candles',
    'natural skincare',
    'boutique Maryland',
    'Maryland boutique',
    'natural ingredients',
    'handcrafted products',
    'eco-friendly candles',
    'self-care products',
  ],
  candles: [
    'soy candles',
    'handmade candles',
    'natural candles',
    'scented candles',
    'hand-poured candles',
    'essential oil candles',
    'aromatherapy candles',
    'luxury candles',
    'clean burning candles',
  ],
  skincare: [
    'natural skincare',
    'body butter',
    'handmade soap',
    'organic skincare',
    'whipped body butter',
    'natural body scrub',
    'handmade lotion',
    'natural moisturizer',
  ],
  bodyOils: [
    'natural body oils',
    'massage oils',
    'moisturizing oils',
    'essential oil blends',
    'aromatherapy oils',
  ],
  roomSprays: [
    'room spray',
    'air freshener',
    'natural room spray',
    'home fragrance',
    'linen spray',
  ],
  scents: {
    citrus: ['citrus candles', 'orange candles', 'lemon scented', 'fresh citrus'],
    floral: ['floral candles', 'rose candles', 'lavender candles', 'flower scented'],
    fresh: ['fresh candles', 'clean scent', 'crisp fragrance', 'ocean breeze'],
    sweet: ['sweet candles', 'vanilla candles', 'bakery scented', 'dessert candles'],
    woodsy: ['woodsy candles', 'cedar candles', 'forest scent', 'pine candles'],
    herbal: ['herbal candles', 'sage candles', 'eucalyptus', 'mint candles'],
    earthy: ['earthy candles', 'sandalwood', 'patchouli', 'musk candles'],
  },
};

// Generate metadata for a page
interface GenerateMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  image,
  path = '',
  type = 'website',
  noIndex = false,
}: GenerateMetadataOptions): Metadata {
  const fullTitle = title.includes(SITE_CONFIG.name) 
    ? title 
    : `${title} | ${SITE_CONFIG.name}`;
  
  const url = `${SITE_CONFIG.url}${path}`;
  const ogImage = image || SITE_CONFIG.ogImage;
  const allKeywords = [...SEO_KEYWORDS.general, ...keywords];

  return {
    title: fullTitle,
    description,
    keywords: allKeywords.join(', '),
    authors: [{ name: SITE_CONFIG.name }],
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: type === 'article' ? 'article' : 'website',
      locale: SITE_CONFIG.locale,
      url,
      siteName: SITE_CONFIG.name,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${SITE_CONFIG.url}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${SITE_CONFIG.url}${ogImage}`],
    },
  };
}

// JSON-LD Schema Generators

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

export function generateOrganizationSchema(): OrganizationSchema {
  const socialLinks = Object.values(SITE_CONFIG.social).filter(Boolean);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    description: SITE_CONFIG.description,
    address: {
      '@type': 'PostalAddress',
      ...SITE_CONFIG.address,
    },
    ...(socialLinks.length > 0 && { sameAs: socialLinks }),
  };
}

export interface LocalBusinessSchema {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness';
  '@id': string;
  name: string;
  description: string;
  url: string;
  logo: string;
  image: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  email?: string;
  priceRange?: string;
  openingHoursSpecification?: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }>;
}

export function generateLocalBusinessSchema(): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_CONFIG.url}/#localbusiness`,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    image: `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`,
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'MD',
      addressCountry: 'US',
      streetAddress: '',
      addressLocality: '',
      postalCode: '',
    },
    ...(SITE_CONFIG.phone && { telephone: SITE_CONFIG.phone }),
    ...(SITE_CONFIG.email && { email: SITE_CONFIG.email }),
    priceRange: '$$',
  };
}

export interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image: string | string[];
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    url: string;
    priceCurrency: string;
    price: number;
    availability: string;
    seller: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
  };
  sku?: string;
  category?: string;
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string | string[];
  price: number;
  url: string;
  inStock: boolean;
  sku?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
}): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.inStock 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
      },
    },
    ...(product.sku && { sku: product.sku }),
    ...(product.category && { category: product.category }),
    ...(product.rating && product.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    }),
  };
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.path}`,
    })),
  };
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  image: string;
  author: {
    '@type': 'Organization';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished: string;
  dateModified?: string;
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
}

export function generateArticleSchema(article: {
  headline: string;
  description: string;
  image: string;
  url: string;
  datePublished: string;
  dateModified?: string;
}): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    image: article.image.startsWith('http') ? article.image : `${SITE_CONFIG.url}${article.image}`,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
      },
    },
    datePublished: article.datePublished,
    ...(article.dateModified && { dateModified: article.dateModified }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/collections/all?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// Collection page metadata generators
export function generateCollectionMetadata(
  collectionName: string,
  description: string,
  keywords: string[],
  path: string
): Metadata {
  return generatePageMetadata({
    title: `${collectionName} - Shop ${collectionName}`,
    description: `${description} Shop our ${collectionName.toLowerCase()} collection at ${SITE_CONFIG.name}. ${SITE_CONFIG.tagline}.`,
    keywords,
    path,
  });
}

// Product page metadata generator
export function generateProductMetadata(product: {
  name: string;
  description: string;
  image?: string;
  handle: string;
  category?: string;
}): Metadata {
  const categoryKeywords = product.category 
    ? SEO_KEYWORDS[product.category.toLowerCase() as keyof typeof SEO_KEYWORDS] || []
    : [];
  
  return generatePageMetadata({
    title: product.name,
    description: product.description || `Shop ${product.name} at ${SITE_CONFIG.name}. ${SITE_CONFIG.tagline}.`,
    keywords: Array.isArray(categoryKeywords) ? categoryKeywords : [],
    image: product.image,
    path: `/products/${product.handle}`,
    type: 'product',
  });
}

