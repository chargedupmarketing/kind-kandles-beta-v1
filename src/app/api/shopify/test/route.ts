import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    console.log('=== Shopify Test API Route ===');
    console.log('Environment check:', {
      storeDomain: storeDomain ? 'Set' : 'Missing',
      accessToken: accessToken ? 'Set' : 'Missing'
    });

    if (!storeDomain || !accessToken) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'Shopify not configured' },
        { status: 500 }
      );
    }

    console.log('Making direct fetch request to Shopify...');

    // Test query to get products
    const query = `
      {
        products(first: 5) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `;

    const endpoint = `https://${storeDomain}/api/2024-10/graphql.json`;
    console.log('Endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    console.log('Response status:', response.status);
    
    const responseData = await response.json();
    console.log('Shopify response:', JSON.stringify(responseData, null, 2));

    if (responseData.data?.products) {
      const productCount = responseData.data.products.edges.length;
      console.log('Success! Found', productCount, 'products');
      return NextResponse.json({
        success: true,
        data: {
          name: 'My Kind Kandles & Boutique',
          domain: storeDomain,
          productsFound: productCount,
          products: responseData.data.products.edges.map((edge: any) => edge.node.title),
          message: 'Successfully connected to Shopify Storefront API!'
        }
      });
    } else if (responseData.errors) {
      console.error('GraphQL errors:', responseData.errors);
      return NextResponse.json(
        { 
          error: 'GraphQL errors',
          details: responseData.errors
        },
        { status: 500 }
      );
    } else {
      console.error('No data in response:', responseData);
      return NextResponse.json(
        { 
          error: 'No data received',
          response: responseData
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Shopify API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to Shopify',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

