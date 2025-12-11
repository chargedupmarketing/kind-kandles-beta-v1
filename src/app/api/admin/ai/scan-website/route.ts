import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, model } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json({ 
        error: errorData.error?.message || 'Failed to analyze website' 
      }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No analysis generated';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Website scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

