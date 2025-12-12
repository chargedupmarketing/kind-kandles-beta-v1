'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, ShippingAddress, CartItem } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/localStore';
import { Lock, CreditCard, AlertCircle, Smartphone, Wallet } from 'lucide-react';

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
    ApplePaySession?: any;
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
  const [applePay, setApplePay] = useState<any>(null);
  const [googlePay, setGooglePay] = useState<any>(null);
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);
  const [isCardContainerReady, setIsCardContainerReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'apple' | 'google'>('card');
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const paymentsRef = useRef<any>(null);
  const initAttemptedRef = useRef(false);

  // Calculate final total for payment request
  const finalTotal = total;

  // Mark container as ready after mount
  useEffect(() => {
    // Wait for next tick to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsCardContainerReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const initializePayments = useCallback(async (config: { applicationId: string; locationId: string }) => {
    try {
      // Double-check the container exists
      const container = document.getElementById('card-container');
      if (!container) {
        console.error('Card container still not found');
        setError('Payment form container not found. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      if (!window.Square) {
        console.error('Square SDK not available');
        setError('Square SDK not loaded. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      console.log('Initializing Square payments with config:', config);
      const payments = await window.Square.payments(config.applicationId, config.locationId);
      paymentsRef.current = payments;

      // Create card payment method
      const cardInstance = await payments.card();
      console.log('Card instance created, attaching to container...');
      await cardInstance.attach('#card-container');
      console.log('Card attached successfully');
      setCard(cardInstance);

      // Try to initialize Apple Pay
      try {
        if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
          const applePayInstance = await payments.applePay({
            countryCode: 'US',
            currencyCode: 'USD',
            total: {
              amount: finalTotal.toFixed(2),
              label: 'My Kind Kandles & Boutique',
            },
          });
          setApplePay(applePayInstance);
          setIsApplePayAvailable(true);
          console.log('Apple Pay initialized');
        }
      } catch (appleErr) {
        console.log('Apple Pay not available:', appleErr);
      }

      // Try to initialize Google Pay
      try {
        const googlePayInstance = await payments.googlePay({
          countryCode: 'US',
          currencyCode: 'USD',
          total: {
            amount: finalTotal.toFixed(2),
            label: 'My Kind Kandles & Boutique',
          },
          buttonColor: 'black',
          buttonType: 'short',
          buttonSizeMode: 'fill',
        });
        
        // Check if Google Pay is available
        const isAvailable = await googlePayInstance.isAvailable();
        if (isAvailable) {
          setGooglePay(googlePayInstance);
          setIsGooglePayAvailable(true);
          console.log('Google Pay initialized');
        }
      } catch (googleErr) {
        console.log('Google Pay not available:', googleErr);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing payments:', err);
      setError('Failed to initialize payment form. Please refresh the page.');
      setIsLoading(false);
    }
  }, [finalTotal]);

  const loadSquareSDK = useCallback(async () => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    try {
      // Fetch config first
      console.log('Fetching Square config...');
      const configResponse = await fetch('/api/checkout/square-config');
      const config = await configResponse.json();
      console.log('Square config received:', config);

      if (!config.applicationId || !config.locationId) {
        setError('Square is not configured. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Determine SDK URL based on environment
      const sdkUrl = config.environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';

      // Check if SDK is already loaded
      if (window.Square) {
        console.log('Square SDK already loaded');
        await initializePayments(config);
        return;
      }

      // Load the SDK
      console.log('Loading Square SDK from:', sdkUrl);
      const script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      
      script.onload = async () => {
        console.log('Square SDK loaded successfully');
        // Wait a bit for Square to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        await initializePayments(config);
      };
      
      script.onerror = () => {
        console.error('Failed to load Square SDK');
        setError('Failed to load payment SDK. Please check your internet connection.');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    } catch (err) {
      console.error('Error in loadSquareSDK:', err);
      setError('Failed to initialize payment system.');
      setIsLoading(false);
    }
  }, [initializePayments]);

  // Start loading when container is ready
  useEffect(() => {
    if (isCardContainerReady && !card && !initAttemptedRef.current) {
      loadSquareSDK();
    }
  }, [isCardContainerReady, card, loadSquareSDK]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (card) {
        try {
          card.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (applePay) {
        try {
          applePay.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (googlePay) {
        try {
          googlePay.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [card, applePay, googlePay]);

  // Process payment with token
  const processPayment = async (token: string) => {
    const response = await fetch('/api/checkout/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: token,
        items,
        shippingAddress,
        shippingCost,
        discountCode,
        discountAmount,
      }),
    });

    const result = await response.json();

    if (result.success) {
      await createOrder(result.paymentId);
    } else {
      setError(result.error || 'Payment failed');
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
        await processPayment(tokenResult.token);
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

  const handleApplePay = async () => {
    if (!applePay) return;

    setIsProcessing(true);
    setError(null);

    try {
      const tokenResult = await applePay.tokenize();
      
      if (tokenResult.status === 'OK') {
        await processPayment(tokenResult.token);
      } else {
        let errorMessage = 'Apple Pay failed';
        if (tokenResult.errors) {
          errorMessage = tokenResult.errors.map((e: any) => e.message).join(', ');
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Apple Pay error:', err);
      setError('Apple Pay failed. Please try another payment method.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGooglePay = async () => {
    if (!googlePay) return;

    setIsProcessing(true);
    setError(null);

    try {
      const tokenResult = await googlePay.tokenize();
      
      if (tokenResult.status === 'OK') {
        await processPayment(tokenResult.token);
      } else {
        let errorMessage = 'Google Pay failed';
        if (tokenResult.errors) {
          errorMessage = tokenResult.errors.map((e: any) => e.message).join(', ');
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Google Pay error:', err);
      setError('Google Pay failed. Please try another payment method.');
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

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    initAttemptedRef.current = false;
    loadSquareSDK();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>

      {/* Express Checkout Options */}
      {(isApplePayAvailable || isGooglePayAvailable) && !isLoading && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
            Express Checkout
          </p>
          <div className="flex gap-3">
            {isApplePayAvailable && (
              <button
                type="button"
                onClick={handleApplePay}
                disabled={isProcessing}
                className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple Pay
              </button>
            )}
            {isGooglePayAvailable && (
              <button
                type="button"
                onClick={handleGooglePay}
                disabled={isProcessing}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Pay
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-gray-900 text-gray-500">or pay with card</span>
            </div>
          </div>
        </div>
      )}

      {/* Card Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Card Information
          </label>
          <div className="relative min-h-[100px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg border z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
                  <span className="text-sm text-gray-500">Loading payment form...</span>
                </div>
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
          <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              <button
                type="button"
                onClick={handleRetry}
                className="block mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!card || isProcessing || isLoading}
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
      </form>

      {/* Payment Methods Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-4 pt-2">
          <span className="text-xs text-gray-500">Powered by</span>
          <svg className="h-6" viewBox="0 0 100 24" fill="currentColor">
            <path d="M10.5 0C4.7 0 0 4.7 0 10.5S4.7 21 10.5 21 21 16.3 21 10.5 16.3 0 10.5 0zm0 17.5c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z"/>
            <text x="25" y="16" fontSize="14" fontWeight="bold">Square</text>
          </svg>
        </div>

        {/* Accepted Cards */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-gray-400">Accepted:</span>
          <div className="flex gap-1">
            {/* Visa */}
            <div className="w-8 h-5 bg-white border rounded flex items-center justify-center">
              <svg className="h-3" viewBox="0 0 50 16" fill="#1A1F71">
                <path d="M19.13 15.14h-3.63l2.27-14h3.63l-2.27 14zm15.53-13.67c-.72-.28-1.84-.58-3.24-.58-3.58 0-6.1 1.9-6.12 4.62-.03 2.01 1.8 3.13 3.17 3.8 1.41.69 1.88 1.13 1.88 1.75-.01.94-1.13 1.37-2.17 1.37-1.45 0-2.22-.21-3.41-.73l-.47-.22-.51 3.15c.85.39 2.41.73 4.04.75 3.81 0 6.28-1.88 6.31-4.78.01-1.59-.95-2.8-3.04-3.8-1.27-.65-2.04-1.08-2.03-1.73 0-.58.65-1.2 2.07-1.2 1.18-.02 2.04.25 2.7.53l.33.16.49-3.09zM41.93 1.14h-2.8c-.87 0-1.52.25-1.9 1.16l-5.38 12.84h3.8l.76-2.1h4.65l.44 2.1h3.35l-2.92-14zm-4.47 9.02c.3-.81 1.45-3.93 1.45-3.93-.02.04.3-.81.48-1.34l.25 1.21.84 4.06h-3.02zM14.68 1.14l-3.55 9.54-.38-1.93c-.66-2.23-2.71-4.65-5.01-5.86l3.24 12.24h3.83l5.7-14h-3.83z"/>
              </svg>
            </div>
            {/* Mastercard */}
            <div className="w-8 h-5 bg-white border rounded flex items-center justify-center">
              <svg className="h-4" viewBox="0 0 32 20">
                <circle cx="10" cy="10" r="10" fill="#EB001B"/>
                <circle cx="22" cy="10" r="10" fill="#F79E1B"/>
                <path d="M16 3.5c2.4 1.8 4 4.7 4 8s-1.6 6.2-4 8c-2.4-1.8-4-4.7-4-8s1.6-6.2 4-8z" fill="#FF5F00"/>
              </svg>
            </div>
            {/* Amex */}
            <div className="w-8 h-5 bg-[#006FCF] border rounded flex items-center justify-center">
              <span className="text-white text-[6px] font-bold">AMEX</span>
            </div>
            {/* Discover */}
            <div className="w-8 h-5 bg-white border rounded flex items-center justify-center">
              <span className="text-orange-500 text-[6px] font-bold">DISCOVER</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-gray-500">
        By completing your purchase, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
