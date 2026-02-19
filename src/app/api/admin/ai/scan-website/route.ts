import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.' 
      }, { status: 500 });
    }

    const supabase = createServerClient();

    // Fetch business data from the database
    const [
      { data: products },
      { data: collections },
      { data: orders },
      { data: customers },
      { data: settings }
    ] = await Promise.all([
      supabase.from('products').select('title, description, product_type, price, tags').limit(50),
      supabase.from('collections').select('title, description'),
      supabase.from('orders').select('total, status, created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('customers').select('id').limit(1000),
      supabase.from('settings').select('key, value')
    ]);

    // Compile website data summary
    const websiteData = {
      products: products?.length || 0,
      productTypes: [...new Set(products?.map(p => p.product_type).filter(Boolean))],
      productSamples: products?.slice(0, 10).map(p => ({
        title: p.title,
        type: p.product_type,
        price: p.price,
        tags: p.tags
      })),
      collections: collections?.map(c => c.title) || [],
      totalOrders: orders?.length || 0,
      recentOrderStatuses: orders?.slice(0, 10).map(o => o.status),
      totalCustomers: customers?.length || 0,
      storeSettings: settings?.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, unknown>)
    };

    const systemPrompt = `You are analyzing the "My Kind Kandles & Boutique" website. Based on the data provided, give a comprehensive summary of the business including:

1. **Product Inventory Overview**: Types of products, pricing range, popular categories
2. **Business Performance**: Order trends, customer base size
3. **Recommendations**: Suggestions for improvement, missing products, marketing opportunities
4. **SEO & Content**: Suggestions for product descriptions or tags that could be improved

Be specific and actionable in your recommendations.`;

    const userPrompt = `Here is the current website data:

**Products (${websiteData.products} total)**
Product Types: ${websiteData.productTypes.join(', ')}

Sample Products:
${websiteData.productSamples?.map(p => `- ${p.title} (${p.type}) - $${p.price} [Tags: ${p.tags?.join(', ') || 'none'}]`).join('\n')}

**Collections**: ${websiteData.collections.join(', ')}

**Orders**: ${websiteData.totalOrders} recent orders
Order Statuses: ${[...new Set(websiteData.recentOrderStatuses)].join(', ')}

**Customers**: ${websiteData.totalCustomers} total customers

Please analyze this data and provide insights and recommendations for the business.`;

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : 'No analysis generated';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Website scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

