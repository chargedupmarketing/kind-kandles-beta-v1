'use client';

import { useEffect, useState } from 'react';

export default function TestShopifyConnection() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      setLoading(true);
      
      // Check environment variables
      const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
      const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

      if (!domain || !token) {
        setResult({
          error: 'Missing environment variables',
          details: {
            domain: domain ? '✅ Set' : '❌ Missing',
            token: token ? '✅ Set' : '❌ Missing',
          },
          instructions: [
            '1. Create .env.local file in project root',
            '2. Add: NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com',
            '3. Add: NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token',
            '4. Restart dev server (Ctrl+C then npm run dev)'
          ]
        });
        setLoading(false);
        return;
      }

      try {
        // Use our API route instead of direct fetch to avoid CORS
        const response = await fetch('/api/test-shopify-connection');
        const data = await response.json();
        
        setResult({
          success: response.ok && data.success,
          status: response.status,
          statusText: response.statusText,
          config: {
            domain: domain,
            tokenPrefix: token.substring(0, 8) + '...',
            tokenLength: token.length
          },
          data: data,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        setResult({
          error: 'Connection failed',
          message: error.message,
          details: error.toString()
        });
      }
      
      setLoading(false);
    };

    testConnection();
  }, []);

  const getStatusColor = () => {
    if (loading) return 'border-blue-500 bg-blue-50';
    if (result?.success) return 'border-green-500 bg-green-50';
    return 'border-red-500 bg-red-50';
  };

  const getStatusIcon = () => {
    if (loading) return '⏳';
    if (result?.success) return '✅';
    return '❌';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Shopify Connection Test</h1>
        <p className="text-gray-600 mb-8">
          Testing connection to Shopify Storefront API
        </p>

        <div className={`border-4 rounded-lg p-6 mb-6 ${getStatusColor()}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{getStatusIcon()}</span>
            <div>
              <h2 className="text-xl font-bold">
                {loading ? 'Testing Connection...' : 
                 result?.success ? 'Connection Successful!' : 
                 'Connection Failed'}
              </h2>
              {result?.status && (
                <p className="text-sm text-gray-600">
                  HTTP Status: {result.status} {result.statusText}
                </p>
              )}
            </div>
          </div>

          {result?.config && (
            <div className="bg-white rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">Configuration:</h3>
              <ul className="text-sm space-y-1">
                <li>• Domain: {result.config.domain}</li>
                <li>• Token: {result.config.tokenPrefix} ({result.config.tokenLength} chars)</li>
              </ul>
            </div>
          )}

          {result?.data?.data?.shop && (
            <div className="bg-white rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">Store Information:</h3>
              <ul className="text-sm space-y-1">
                <li>• Name: {result.data.data.shop.name}</li>
                <li>• URL: {result.data.data.shop.primaryDomain.url}</li>
                <li>• Currency: {result.data.data.shop.paymentSettings.currencyCode}</li>
                {result.data.data.shop.description && (
                  <li>• Description: {result.data.data.shop.description}</li>
                )}
              </ul>
            </div>
          )}

          {result?.data?.data?.products && (
            <div className="bg-white rounded p-4">
              <h3 className="font-semibold mb-2">
                Products Found: {result.data.data.products.edges.length}
              </h3>
              {result.data.data.products.edges.length > 0 ? (
                <ul className="text-sm space-y-2">
                  {result.data.data.products.edges.map((edge: any, idx: number) => (
                    <li key={idx} className="border-l-2 border-green-500 pl-2">
                      <strong>{edge.node.title}</strong>
                      <br />
                      <span className="text-gray-600">
                        Handle: {edge.node.handle} | 
                        Price: {edge.node.priceRange.minVariantPrice.amount} {edge.node.priceRange.minVariantPrice.currencyCode}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-amber-600">
                  ⚠️ No products found. Make sure products are published to "Online Store" sales channel.
                </p>
              )}
            </div>
          )}

          {result?.error && (
            <div className="bg-white rounded p-4">
              <h3 className="font-semibold text-red-600 mb-2">Error Details:</h3>
              <p className="text-sm mb-2">{result.message || result.error}</p>
              {result.instructions && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Setup Instructions:</h4>
                  <ol className="text-sm space-y-1">
                    {result.instructions.map((instruction: string, idx: number) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
              {result.data?.errors && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">GraphQL Errors:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data.errors, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Full Response:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📚 Need Help?</h3>
          <p className="text-sm mb-2">
            If the connection failed, check:
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Environment variables are set correctly in <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
            <li>Using Storefront API token (not Admin API)</li>
            <li>Storefront API scopes are configured in Shopify app</li>
            <li>App is installed in Shopify admin</li>
            <li>Products are published to "Online Store" channel</li>
          </ul>
          <p className="text-sm mt-3">
            See <code className="bg-blue-100 px-1 rounded">docs/SHOPIFY_CONNECTION_TROUBLESHOOTING.md</code> for detailed help.
          </p>
        </div>
      </div>
    </div>
  );
}

