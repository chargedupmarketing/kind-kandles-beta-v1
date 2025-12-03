'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';

interface ConnectionStatus {
  status: 'loading' | 'success' | 'error' | 'not-configured';
  message: string;
  data?: any;
}

export default function ShopifyConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'loading',
    message: 'Testing Shopify connection...'
  });

  useEffect(() => {
    testShopifyConnection();
  }, []);

  const testShopifyConnection = async () => {
    try {
      console.log('Testing Shopify connection via API route...');

      const response = await fetch('/api/shopify/test');
      const result = await response.json();
      
      console.log('API Response:', result);
      
      if (response.ok && result.success) {
        setConnectionStatus({
          status: 'success',
          message: 'Successfully connected to Shopify!',
          data: result.data
        });
      } else if (result.error === 'Shopify not configured') {
        setConnectionStatus({
          status: 'not-configured',
          message: 'Shopify client not configured. Please check your environment variables.'
        });
      } else {
        const errorDetails = result.details ? JSON.stringify(result.details, null, 2) : '';
        throw new Error(`${result.error || 'Unknown error'}${errorDetails ? '\n\nDetails:\n' + errorDetails : ''}`);
      }
    } catch (error) {
      console.error('Shopify connection error:', error);
      setConnectionStatus({
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'loading':
        return <Loader className="h-6 w-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'not-configured':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'not-configured':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 border rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center space-x-3 mb-4">
        {getStatusIcon()}
        <h2 className="text-xl font-semibold text-gray-900">
          Shopify Connection Test
        </h2>
      </div>

      <p className="text-gray-700 mb-4">
        {connectionStatus.message}
      </p>

      {connectionStatus.status === 'success' && connectionStatus.data && (
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold text-gray-900 mb-2">Store Information:</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li><strong>Store:</strong> {connectionStatus.data.name}</li>
            <li><strong>Domain:</strong> {connectionStatus.data.domain}</li>
            <li><strong>Products Found:</strong> {connectionStatus.data.productsFound}</li>
            {connectionStatus.data.products && connectionStatus.data.products.length > 0 && (
              <li>
                <strong>Sample Products:</strong>
                <ul className="ml-4 mt-1">
                  {connectionStatus.data.products.map((product: string, index: number) => (
                    <li key={index}>• {product}</li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </div>
      )}

      {connectionStatus.status === 'not-configured' && (
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold text-gray-900 mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
            <li>Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root</li>
            <li>Add your Shopify store domain: <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com</code></li>
            <li>Add your Storefront API token: <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here</code></li>
            <li>Restart your development server</li>
          </ol>
        </div>
      )}

      {connectionStatus.status === 'error' && (
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold text-gray-900 mb-2">Troubleshooting:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Check that your Storefront API token is correct</li>
            <li>Verify your store domain is in the format: yourstore.myshopify.com</li>
            <li>Ensure the Storefront API scopes are properly configured</li>
            <li>Restart your development server after adding environment variables</li>
            <li>Make sure products are published to "Online Store" sales channel</li>
          </ul>
        </div>
      )}

      <button
        onClick={testShopifyConnection}
        disabled={connectionStatus.status === 'loading'}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {connectionStatus.status === 'loading' ? 'Testing...' : 'Test Connection Again'}
      </button>
    </div>
  );
}

