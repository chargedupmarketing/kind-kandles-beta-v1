'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { useCart, ShippingAddress, CartItem } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/localStore';
import { Lock, CreditCard, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { total, shippingAddress } = useCart();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        receipt_email: shippingAddress?.email,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An error occurred');
      onError(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>

      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
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

      <p className="text-xs text-center text-gray-500">
        By completing your purchase, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}

interface StripePaymentFormProps {
  shippingAddress: ShippingAddress;
  items: CartItem[];
  shippingCost: number;
  discountCode?: string;
  discountAmount?: number;
  onSuccess: () => void;
}

export default function StripePaymentForm({
  shippingAddress,
  items,
  shippingCost,
  discountCode,
  discountAmount,
  onSuccess,
}: StripePaymentFormProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            shippingAddress,
            shippingCost,
            discountCode,
            discountAmount,
          }),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        setError('Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [items, shippingAddress, shippingCost, discountCode, discountAmount]);

  const handleSuccess = async (paymentIntentId: string) => {
    // Create order in database
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
          payment_intent_id: paymentIntentId,
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
        // Redirect to success page with order number
        router.push(`/checkout/success?order=${data.order.order_number}`);
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating order:', err);
      // Still redirect to success since payment was successful
      router.push('/checkout/success');
      onSuccess();
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
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

  if (!clientSecret) {
    return null;
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#db2777',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentForm
        clientSecret={clientSecret}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </Elements>
  );
}

