/**
 * Image Matching Utilities
 * Provides fuzzy matching and scoring algorithms for product identification
 */

export interface Product {
  id: string;
  title: string;
  handle: string;
  product_type: string | null;
  tags: string[];
  description: string | null;
  images?: { url: string }[];
}

export interface ExtractedInfo {
  productName: string;
  scentName: string;
  productType: string;
  visualFeatures: {
    colors: string[];
    containerType: string;
    size: string;
  };
}

export interface ProductMatch {
  productId: string;
  productTitle: string;
  productHandle: string;
  confidence: number;
  matchReasons: string[];
  product: Product;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings (0-100)
 */
function stringSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(str1, str2);
  return ((maxLen - distance) / maxLen) * 100;
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check if a string contains another string (fuzzy)
 */
function fuzzyContains(haystack: string, needle: string, threshold: number = 80): boolean {
  const normalizedHaystack = normalizeString(haystack);
  const normalizedNeedle = normalizeString(needle);
  
  if (normalizedHaystack.includes(normalizedNeedle)) {
    return true;
  }
  
  // Check word-by-word
  const haystackWords = normalizedHaystack.split(' ');
  const needleWords = normalizedNeedle.split(' ');
  
  for (const needleWord of needleWords) {
    if (needleWord.length < 3) continue; // Skip very short words
    
    for (const haystackWord of haystackWords) {
      if (stringSimilarity(haystackWord, needleWord) >= threshold) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Match extracted product info against database products
 * Returns top 3 matches with confidence scores
 */
export function matchProducts(
  extractedInfo: ExtractedInfo,
  products: Product[]
): ProductMatch[] {
  const matches: ProductMatch[] = [];

  for (const product of products) {
    let score = 0;
    const reasons: string[] = [];

    const normalizedProductTitle = normalizeString(product.title);
    const normalizedExtractedName = normalizeString(extractedInfo.productName);

    // Exact product name match: +50 points
    if (normalizedProductTitle === normalizedExtractedName) {
      score += 50;
      reasons.push('Exact product name match');
    } else {
      // Fuzzy product name match (>80% similarity): +35 points
      const similarity = stringSimilarity(normalizedProductTitle, normalizedExtractedName);
      if (similarity >= 80) {
        score += 35;
        reasons.push(`Product name ${Math.round(similarity)}% similar`);
      } else if (similarity >= 60) {
        score += 20;
        reasons.push(`Product name ${Math.round(similarity)}% similar`);
      } else if (fuzzyContains(normalizedProductTitle, normalizedExtractedName, 75)) {
        score += 15;
        reasons.push('Product name partially matches');
      }
    }

    // Scent name in tags: +20 points
    if (extractedInfo.scentName) {
      const normalizedScentName = normalizeString(extractedInfo.scentName);
      const productTags = (product.tags || []).map(tag => normalizeString(tag));
      
      for (const tag of productTags) {
        if (tag === normalizedScentName || fuzzyContains(tag, normalizedScentName, 85)) {
          score += 20;
          reasons.push(`Scent name matches tag: "${extractedInfo.scentName}"`);
          break;
        }
      }
      
      // Also check if scent name is in product title
      if (fuzzyContains(normalizedProductTitle, normalizedScentName, 85)) {
        score += 15;
        reasons.push(`Scent name found in product title`);
      }
    }

    // Product type match: +15 points
    if (extractedInfo.productType && product.product_type) {
      const normalizedExtractedType = normalizeString(extractedInfo.productType);
      const normalizedProductType = normalizeString(product.product_type);
      
      if (normalizedExtractedType === normalizedProductType) {
        score += 15;
        reasons.push('Product type matches');
      } else if (stringSimilarity(normalizedExtractedType, normalizedProductType) >= 70) {
        score += 10;
        reasons.push('Product type similar');
      }
    }

    // Visual features match (colors, container): +10 points
    if (extractedInfo.visualFeatures) {
      const { colors, containerType } = extractedInfo.visualFeatures;
      
      // Check colors in tags or description
      if (colors && colors.length > 0) {
        const productText = `${product.title} ${(product.tags || []).join(' ')} ${product.description || ''}`;
        const normalizedProductText = normalizeString(productText);
        
        let colorMatches = 0;
        for (const color of colors) {
          if (fuzzyContains(normalizedProductText, color, 85)) {
            colorMatches++;
          }
        }
        
        if (colorMatches > 0) {
          score += Math.min(5, colorMatches * 2);
          reasons.push(`${colorMatches} color(s) match`);
        }
      }
      
      // Check container type
      if (containerType) {
        const productText = `${product.title} ${(product.tags || []).join(' ')} ${product.description || ''}`;
        if (fuzzyContains(productText, containerType, 80)) {
          score += 5;
          reasons.push(`Container type matches: ${containerType}`);
        }
      }
    }

    // Description keywords match: +5 points
    if (product.description && extractedInfo.productName) {
      const normalizedDescription = normalizeString(product.description);
      const extractedWords = normalizedExtractedName.split(' ').filter(w => w.length > 3);
      
      let keywordMatches = 0;
      for (const word of extractedWords) {
        if (normalizedDescription.includes(word)) {
          keywordMatches++;
        }
      }
      
      if (keywordMatches > 0) {
        score += Math.min(5, keywordMatches);
        reasons.push(`${keywordMatches} keyword(s) in description`);
      }
    }

    // Only include products with some level of match
    if (score > 0) {
      matches.push({
        productId: product.id,
        productTitle: product.title,
        productHandle: product.handle,
        confidence: Math.min(100, score), // Cap at 100
        matchReasons: reasons,
        product: product,
      });
    }
  }

  // Sort by confidence (highest first) and return top 3
  return matches
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

