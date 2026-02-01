import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for processing multiple products

interface ImageAnalysis {
  imageId: string;
  imageUrl: string;
  backgroundBrightness: number; // 0-100, higher = whiter background
  hasWhiteBackground: boolean;
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
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'No product IDs provided' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const anthropic = new Anthropic({ apiKey });

    const results: Array<{
      productId: string;
      productTitle: string;
      success: boolean;
      imagesReorganized: number;
      error?: string;
    }> = [];

    // Process each product
    for (const productId of productIds) {
      try {
        // Fetch product with images
        const { data: product, error: productError } = await supabase
          .from('products')
          .select(`
            id,
            title,
            images:product_images(id, url, alt_text, position)
          `)
          .eq('id', productId)
          .single();

        if (productError || !product) {
          results.push({
            productId,
            productTitle: 'Unknown',
            success: false,
            imagesReorganized: 0,
            error: 'Product not found'
          });
          continue;
        }

        const images = (product.images as any[]) || [];

        if (images.length === 0) {
          results.push({
            productId,
            productTitle: product.title,
            success: true,
            imagesReorganized: 0,
            error: 'No images to organize'
          });
          continue;
        }

        // Analyze each image's background
        const analyses: ImageAnalysis[] = [];
        
        for (const image of images) {
          try {
            const analysis = await analyzeImageBackground(image.url, anthropic);
            analyses.push({
              imageId: image.id,
              imageUrl: image.url,
              backgroundBrightness: analysis.brightness,
              hasWhiteBackground: analysis.isWhite
            });
          } catch (error) {
            console.error(`Error analyzing image ${image.id}:`, error);
            // If analysis fails, assign a default low score
            analyses.push({
              imageId: image.id,
              imageUrl: image.url,
              backgroundBrightness: 50,
              hasWhiteBackground: false
            });
          }
        }

        // Sort images by background brightness (whiter backgrounds first)
        const sortedAnalyses = [...analyses].sort((a, b) => 
          b.backgroundBrightness - a.backgroundBrightness
        );

        // Update image positions in database
        let updateCount = 0;
        for (let i = 0; i < sortedAnalyses.length; i++) {
          const newPosition = i + 1;
          const { error: updateError } = await supabase
            .from('product_images')
            .update({ position: newPosition })
            .eq('id', sortedAnalyses[i].imageId);

          if (!updateError) {
            updateCount++;
          }
        }

        results.push({
          productId,
          productTitle: product.title,
          success: true,
          imagesReorganized: updateCount
        });

      } catch (error) {
        console.error(`Error processing product ${productId}:`, error);
        results.push({
          productId,
          productTitle: 'Unknown',
          success: false,
          imagesReorganized: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalImagesReorganized = results.reduce((sum, r) => sum + r.imagesReorganized, 0);

    return NextResponse.json({
      success: true,
      message: `Organized images for ${successCount}/${productIds.length} products`,
      totalImagesReorganized,
      results
    });

  } catch (error) {
    console.error('Error in POST /api/admin/products/organize-images:', error);
    
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

async function analyzeImageBackground(
  imageUrl: string,
  anthropic: Anthropic
): Promise<{ brightness: number; isWhite: boolean }> {
  try {
    // Fetch image from URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine media type
    const contentType = imageResponse.headers.get('content-type') || '';
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
    
    if (contentType.includes('png') || imageUrl.toLowerCase().endsWith('.png')) {
      mediaType = 'image/png';
    } else if (contentType.includes('webp') || imageUrl.toLowerCase().endsWith('.webp')) {
      mediaType = 'image/webp';
    } else if (contentType.includes('gif') || imageUrl.toLowerCase().endsWith('.gif')) {
      mediaType = 'image/gif';
    }

    // Call Claude Vision API to analyze background
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
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
              text: `Analyze the background of this product image. 

Please provide your analysis in JSON format:

{
  "brightness": <number 0-100, where 100 is pure white background, 0 is pure black>,
  "isWhite": <boolean, true if background is predominantly white or very light>,
  "description": "<brief description of the background>"
}

Focus on the overall background color and brightness, not the product itself. Consider:
- Pure white backgrounds should score 95-100
- Light gray/off-white backgrounds should score 80-94
- Medium backgrounds should score 40-79
- Dark backgrounds should score 0-39

Return ONLY the JSON object, no other text.`
            }
          ]
        }
      ]
    });

    // Parse response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', responseText);
      return { brightness: 50, isWhite: false };
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      brightness: Math.max(0, Math.min(100, analysis.brightness || 50)),
      isWhite: analysis.isWhite || false
    };

  } catch (error) {
    console.error('Error analyzing image background:', error);
    // Return neutral values on error
    return { brightness: 50, isWhite: false };
  }
}
