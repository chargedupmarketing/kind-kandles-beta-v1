'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/localStore';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Truck, 
  CreditCard, 
  Check,
  ChevronRight,
  Minus,
  Plus,
  X,
  Tag,
  Lock
} from 'lucide-react';

// Dynamically import Square form to avoid SSR issues
const SquarePaymentForm = dynamic(() => import('@/components/SquarePaymentForm'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
    </div>
  )
});

type CheckoutStep = 'cart' | 'shipping' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    totalWeight,
    shippingAddress,
    setShippingAddress,
    shippingRates,
    selectedShippingRate,
    setSelectedShippingRate,
    fetchShippingRates,
    discountCode,
    applyDiscountCode,
    removeDiscountCode,
    clearCart
  } = useCart();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Shipping form state
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });

  // Load saved shipping address
  useEffect(() => {
    if (shippingAddress) {
      setShippingForm({
        firstName: shippingAddress.firstName || '',
        lastName: shippingAddress.lastName || '',
        email: shippingAddress.email || '',
        phone: shippingAddress.phone || '',
        address1: shippingAddress.address1 || '',
        address2: shippingAddress.address2 || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        postalCode: shippingAddress.postalCode || '',
        country: shippingAddress.country || 'US'
      });
    }
  }, [shippingAddress]);

  // Fetch shipping rates when address changes
  useEffect(() => {
    if (currentStep === 'shipping' && shippingForm.postalCode && shippingForm.state) {
      fetchShippingRates();
    }
  }, [currentStep, shippingForm.postalCode, shippingForm.state, fetchShippingRates]);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    
    setIsApplyingDiscount(true);
    setDiscountError('');
    
    const success = await applyDiscountCode(discountInput.trim());
    
    if (!success) {
      setDiscountError('Invalid or expired discount code');
    } else {
      setDiscountInput('');
    }
    
    setIsApplyingDiscount(false);
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setShippingAddress({
      firstName: shippingForm.firstName,
      lastName: shippingForm.lastName,
      email: shippingForm.email,
      phone: shippingForm.phone,
      address1: shippingForm.address1,
      address2: shippingForm.address2,
      city: shippingForm.city,
      state: shippingForm.state,
      postalCode: shippingForm.postalCode,
      country: shippingForm.country
    });
    
    setCurrentStep('payment');
  };

  const steps = [
    { id: 'cart', label: 'Cart', icon: ShoppingBag },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard }
  ];

  if (items.length === 0 && currentStep === 'cart') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products to get started!</p>
          <Link
            href="/collections/all"
            className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
          <span>Back to store</span>
        </Link>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="w-24" /> {/* Spacer for alignment */}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => {
                if (step.id === 'cart') setCurrentStep('cart');
                else if (step.id === 'shipping' && items.length > 0) setCurrentStep('shipping');
              }}
              disabled={step.id === 'payment'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === step.id
                  ? 'bg-pink-600 text-white'
                  : steps.findIndex(s => s.id === currentStep) > index
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {steps.findIndex(s => s.id === currentStep) > index ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <ChevronRight className="h-5 w-5 text-gray-400 mx-2" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Cart Step */}
          {currentStep === 'cart' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Your Cart ({items.length} items)</h2>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4 py-4 border-b last:border-0">
                    {item.image && (
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link href={`/products/${item.handle}`} className="font-semibold hover:text-pink-600">
                        {item.title}
                      </Link>
                      {item.variantTitle && item.variantTitle !== 'Default Title' && (
                        <p className="text-sm text-gray-600">{item.variantTitle}</p>
                      )}
                      <p className="text-pink-600 font-semibold">{formatPrice(item.price)}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="ml-auto text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Code */}
              <div className="mt-6 pt-6 border-t">
                <label className="block text-sm font-medium mb-2">Discount Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <button
                    onClick={handleApplyDiscount}
                    disabled={isApplyingDiscount || !discountInput.trim()}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isApplyingDiscount ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {discountError && (
                  <p className="text-red-600 text-sm mt-1">{discountError}</p>
                )}
                {discountCode?.applied && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-green-50 rounded">
                    <span className="text-green-700 text-sm">
                      Code "{discountCode.code}" applied!
                    </span>
                    <button
                      onClick={removeDiscountCode}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCurrentStep('shipping')}
                className="w-full mt-6 bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
              >
                Continue to Shipping
              </button>
            </div>
          )}

          {/* Shipping Step */}
          {currentStep === 'shipping' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
              
              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.firstName}
                      onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.lastName}
                      onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={shippingForm.email}
                    onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.address1}
                    onChange={(e) => setShippingForm({ ...shippingForm, address1: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Apartment, suite, etc. (optional)</label>
                  <input
                    type="text"
                    value={shippingForm.address2}
                    onChange={(e) => setShippingForm({ ...shippingForm, address2: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.state}
                      onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                      placeholder="e.g., MD"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.postalCode}
                      onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <select
                      value={shippingForm.country}
                      onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                    </select>
                  </div>
                </div>

                {/* Shipping Method Selection */}
                {shippingRates.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">Shipping Method</label>
                    <div className="space-y-2">
                      {shippingRates.map((rate) => (
                        <label
                          key={rate.id}
                          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedShippingRate?.id === rate.id
                              ? 'border-pink-600 bg-pink-50'
                              : 'hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedShippingRate?.id === rate.id}
                              onChange={() => setSelectedShippingRate(rate)}
                              className="text-pink-600 focus:ring-pink-500"
                            />
                            <div>
                              <p className="font-medium">{rate.name}</p>
                              {rate.estimatedDays && (
                                <p className="text-sm text-gray-600">{rate.estimatedDays}</p>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold">
                            {rate.price === 0 ? 'FREE' : formatPrice(rate.price)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('cart')}
                    className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Payment</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Shipping to:</h3>
                <p>{shippingAddress?.firstName} {shippingAddress?.lastName}</p>
                <p>{shippingAddress?.address1}</p>
                {shippingAddress?.address2 && <p>{shippingAddress.address2}</p>}
                <p>{shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postalCode}</p>
                <button
                  onClick={() => setCurrentStep('shipping')}
                  className="text-pink-600 text-sm mt-2 hover:underline"
                >
                  Edit shipping info
                </button>
              </div>

              {/* Square Payment Form */}
              {shippingAddress && (
                <SquarePaymentForm
                  shippingAddress={shippingAddress}
                  items={items}
                  shippingCost={shipping}
                  discountCode={discountCode?.code}
                  discountAmount={discount}
                  onSuccess={() => clearCart()}
                />
              )}

              <button
                onClick={() => setCurrentStep('shipping')}
                className="w-full mt-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Shipping
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            
            {/* Mini cart items */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-center gap-3">
                  {item.image && (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover rounded"
                      />
                      <span className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.variantTitle && item.variantTitle !== 'Default Title' && (
                      <p className="text-xs text-gray-500">{item.variantTitle}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Tax (6%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-pink-600">{formatPrice(total)}</span>
              </div>
            </div>

            {totalWeight > 0 && (
              <p className="text-sm text-center text-gray-600 mt-4">
                Total weight: {(totalWeight / 16).toFixed(2)} lbs
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

