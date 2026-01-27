import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';
import { matchProducts, ExtractedInfo, Product } from '@/lib/imageMatching';

// Configure route for longer processing time
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for AI processing

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface ImageAnalysis {
  imageId: string;
  imageUrl: string;
  extractedInfo: ExtractedInfo;
  matches: Array<{
    productId: string;
    productTitle: string;
    productHandle: string;
    confidence: number;
    matchReasons: string[];
  }>;
  autoAssignRecommended: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Anthropic API key not configured',
          message: 'Please add ANTHROPIC_API_KEY to your .env.local file'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageUrls } = body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'No image URLs provided' },
        { status: 400 }
      );
    }

    if (imageUrls.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images per batch' },
        { status: 400 }
      );
    }

    // Fetch all products from database
    const supabase = createServerClient();
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        handle,
        product_type,
        tags,
        description,
        images:product_images(url)
      `);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products from database' },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { 
          error: 'No products in database',
          message: 'Please add products before using the image analyzer'
        },
        { status: 400 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Process images (limit to 3 concurrent for rate limiting)
    const analyses: ImageAnalysis[] = [];
    const batchSize = 3;

    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      const batchPromises = batch.map((url: string) => analyzeImage(url, anthropic, products as Product[]));
      const batchResults = await Promise.all(batchPromises);
      analyses.push(...batchResults);
    }

    return NextResponse.json({
      success: true,
      analyses: analyses,
      totalProducts: products.length,
    });

  } catch (error) {
    console.error('Error in POST /api/admin/ai/analyze-product-image:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeImage(
  imageUrl: string,
  anthropic: Anthropic,
  products: Product[]
): Promise<ImageAnalysis> {
  try {
    // Fetch image from URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine media type from content-type header or URL extension
    const contentType = imageResponse.headers.get('content-type') || '';
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
    
    if (contentType.includes('png') || imageUrl.toLowerCase().endsWith('.png')) {
      mediaType = 'image/png';
    } else if (contentType.includes('webp') || imageUrl.toLowerCase().endsWith('.webp')) {
      mediaType = 'image/webp';
    } else if (contentType.includes('gif') || imageUrl.toLowerCase().endsWith('.gif')) {
      mediaType = 'image/gif';
    }

    // Call Claude Vision API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `You are analyzing a product image for "My Kind Kandles & Boutique", a handmade candle and skincare business.

Please analyze this image and extract the following information in JSON format:

{
  "productName": "The exact product name as it appears on the label or packaging",
  "scentName": "The scent name if visible (e.g., 'Eucalyptus Spearmint', 'Lavender', 'Calm Down Girl')",
  "productType": "The type of product (e.g., 'Candle', 'Body Butter', 'Body Oil', 'Hair Oil', 'Room Spray', 'Clothing', 'Accessory')",
  "visualFeatures": {
    "colors": ["List of prominent colors in the product"],
    "containerType": "Type of container (e.g., 'jar', 'tin', 'bottle', 'spray bottle', 'tube')",
    "size": "Any size indicators visible (e.g., '8oz', '4oz', 'large', 'small')"
  }
}

Important:
- Be precise with the product name - read any text on labels carefully
- If you can't determine something, use an empty string or empty array
- Focus on text that appears on the product itself, not background elements
- For candles, look for brand name "My Kind Kandles" or "Kind Kandles"
- Common scent collections include "Calm Down Girl" (eucalyptus/spearmint)

Return ONLY the JSON object, no additional text.`
            }
          ],
        },
      ],
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract JSON from response (handle cases where Claude adds markdown formatting)
    let extractedInfo: ExtractedInfo;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      extractedInfo = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      console.error('Response text:', responseText);
      
      // Fallback: create empty extracted info
      extractedInfo = {
        productName: '',
        scentName: '',
        productType: '',
        visualFeatures: {
          colors: [],
          containerType: '',
          size: '',
        },
      };
    }

    // Match against products
    const matches = matchProducts(extractedInfo, products);

    // Determine if auto-assign is recommended
    const autoAssignRecommended = matches.length > 0 && matches[0].confidence > 90;

    return {
      imageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageUrl: imageUrl,
      extractedInfo: extractedInfo,
      matches: matches.map(match => ({
        productId: match.productId,
        productTitle: match.productTitle,
        productHandle: match.productHandle,
        confidence: match.confidence,
        matchReasons: match.matchReasons,
      })),
      autoAssignRecommended: autoAssignRecommended,
    };

  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Return a failed analysis instead of throwing
    return {
      imageId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageUrl: '',
      extractedInfo: {
        productName: '',
        scentName: '',
        productType: '',
        visualFeatures: {
          colors: [],
          containerType: '',
          size: '',
        },
      },
      matches: [],
      autoAssignRecommended: false,
    };
  }
}
