'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, ShippingAddress, CartItem } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/localStore';
import { Lock, CreditCard, AlertCircle } from 'lucide-react';

interface SquarePaymentFormProps {
  shippingAddress: ShippingAddress;
  items: CartItem[];
  shippingCost: number;
  discountCode?: string;
  discountAmount?: number;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => Promise<any>;
    };
  }
}

export default function SquarePaymentForm({
  shippingAddress,
  items,
  shippingCost,
  discountCode,
  discountAmount,
  onSuccess,
}: SquarePaymentFormProps) {
  const router = useRouter();
  const { total } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const paymentsRef = useRef<any>(null);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeSquare();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      // Cleanup
      if (card) {
        card.destroy();
      }
    };
  }, []);

  const initializeSquare = async () => {
    try {
      // Fetch config first to determine environment
      const configResponse = await fetch('/api/checkout/square-config');
      const config = await configResponse.json();
      
      // Load Square Web Payments SDK
      if (!window.Square) {
        const script = document.createElement('script');
        // Use production or sandbox URL based on environment
        const sdkUrl = config.environment === 'production'
          ? 'https://web.squarecdn.com/v1/square.js'
          : 'https://sandbox.web.squarecdn.com/v1/square.js';
        script.src = sdkUrl;
        script.async = true;
        script.onload = () => initializePayments();
        script.onerror = () => setError('Failed to load Square payment SDK');
        document.body.appendChild(script);
      } else {
        await initializePayments();
      }
    } catch (err) {
      console.error('Error initializing Square:', err);
      setError('Failed to initialize payment form');
      setIsLoading(false);
    }
  };

  const initializePayments = async () => {
    try {
      // Fetch Square configuration from API
      const configResponse = await fetch('/api/checkout/square-config');
      const config = await configResponse.json();

      console.log('Square config:', config);

      if (!config.applicationId || !config.locationId) {
        setError('Square is not configured. Please contact support.');
        setIsLoading(false);
        return;
      }

      if (!window.Square) {
        setError('Square SDK not loaded');
        setIsLoading(false);
        return;
      }

      // Wait for the card container to be in the DOM
      const cardContainer = document.getElementById('card-container');
      if (!cardContainer) {
        console.error('Card container not found, retrying...');
        // Retry after a short delay
        setTimeout(() => initializePayments(), 200);
        return;
      }

      const payments = await window.Square.payments(config.applicationId, config.locationId);
      paymentsRef.current = payments;

      // Create card payment method
      const cardInstance = await payments.card();
      await cardInstance.attach('#card-container');
      setCard(cardInstance);
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing payments:', err);
      setError('Failed to initialize payment form. Please refresh the page.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!card) {
      setError('Payment form not ready');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Tokenize the card
      const tokenResult = await card.tokenize();
      
      if (tokenResult.status === 'OK') {
        // Send payment to backend
        const response = await fetch('/api/checkout/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: tokenResult.token,
            items,
            shippingAddress,
            shippingCost,
            discountCode,
            discountAmount,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Create order in database
          await createOrder(result.paymentId);
        } else {
          setError(result.error || 'Payment failed');
        }
      } else {
        let errorMessage = 'Payment failed';
        if (tokenResult.errors) {
          errorMessage = tokenResult.errors.map((e: any) => e.message).join(', ');
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred during payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrder = async (paymentId: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: shippingAddress.email,
          customer_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          customer_phone: shippingAddress.phone,
          shipping_address_line1: shippingAddress.address1,
          shipping_address_line2: shippingAddress.address2,
          shipping_city: shippingAddress.city,
          shipping_state: shippingAddress.state,
          shipping_postal_code: shippingAddress.postalCode,
          shipping_country: shippingAddress.country,
          shipping_cost: shippingCost,
          discount: discountAmount || 0,
          discount_code: discountCode,
          payment_id: paymentId,
          payment_provider: 'square',
          items: items.map(item => ({
            product_id: item.productId,
            variant_id: item.variantId,
            title: item.title,
            variant_title: item.variantTitle,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = await response.json();

      if (data.order) {
        router.push(`/checkout/success?order=${data.order.order_number}`);
        onSuccess();
      } else {
        router.push('/checkout/success');
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating order:', err);
      router.push('/checkout/success');
      onSuccess();
    }
  };

  if (error && !card) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>

      {/* Square Card Container */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Card Information
        </label>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
            </div>
          )}
          <div 
            id="card-container" 
            ref={cardContainerRef}
            className="min-h-[100px] border rounded-lg p-4 bg-white dark:bg-gray-700"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!card || isProcessing}
        className="w-full bg-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay {formatPrice(total)}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 pt-2">
        <span className="text-xs text-gray-500">Powered by</span>
        <svg className="h-6" viewBox="0 0 100 24" fill="currentColor">
          <path d="M10.5 0C4.7 0 0 4.7 0 10.5S4.7 21 10.5 21 21 16.3 21 10.5 16.3 0 10.5 0zm0 17.5c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z"/>
          <text x="25" y="16" fontSize="14" fontWeight="bold">Square</text>
        </svg>
      </div>

      <p className="text-xs text-center text-gray-500">
        By completing your purchase, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}

