import ShopifyConnectionTest from '@/components/ShopifyConnectionTest';

export default function ShopifyTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Shopify Integration Test
          </h1>
          <p className="text-lg text-gray-600">
            This page will help you test and verify your Shopify connection.
          </p>
        </div>
        
        <ShopifyConnectionTest />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Once the connection is successful, you can remove this test page.
          </p>
        </div>
      </div>
    </div>
  );
}

