import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    // Check if configured
    if (!storeDomain || !accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          domain: storeDomain ? 'Set' : 'Missing',
          token: accessToken ? 'Set' : 'Missing'
        }
      }, { status: 500 });
    }

    // Simple test query
    const query = {
      query: `{
        shop {
          name
          primaryDomain { url }
        }
        products(first: 3) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }`
    };

    // Try multiple API versions
    const versions = ['unstable', '2024-10', '2024-07', '2024-04'];
    let lastError = null;

    for (const version of versions) {
      try {
        const url = `https://${storeDomain}/api/${version}/graphql.json`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': accessToken,
          },
          body: JSON.stringify(query),
        });

        const data = await response.json();

        if (response.ok && data.data && data.data.shop) {
          // Success!
          return NextResponse.json({
            success: true,
            message: 'Connection successful!',
            apiVersion: version,
            shop: data.data.shop,
            productsCount: data.data.products?.edges?.length || 0,
            products: data.data.products?.edges || [],
            rawResponse: data
          });
        }

        // Store error for reporting
        lastError = {
          version,
          status: response.status,
          statusText: response.statusText,
          data
        };

      } catch (err: any) {
        lastError = {
          version,
          error: err.message
        };
      }
    }

    // All versions failed
    return NextResponse.json({
      success: false,
      error: 'All API versions failed',
      lastError,
      testedVersions: versions,
      config: {
        domain: storeDomain,
        tokenLength: accessToken.length,
        tokenPrefix: accessToken.substring(0, 8)
      }
    }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Exception occurred',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

