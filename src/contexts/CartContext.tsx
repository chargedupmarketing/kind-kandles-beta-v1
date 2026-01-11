'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  image?: string;
  handle: string;
  sku?: string;
  weight?: number;
  weightUnit?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  price: number;
  estimatedDays?: string;
}

export interface DiscountInfo {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  applied: boolean;
}

interface CartContextType {
  // Cart items
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Totals
  totalItems: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  totalWeight: number;
  
  // Shipping
  shippingAddress: ShippingAddress | null;
  setShippingAddress: (address: ShippingAddress) => void;
  shippingRates: ShippingRate[];
  selectedShippingRate: ShippingRate | null;
  setSelectedShippingRate: (rate: ShippingRate) => void;
  fetchShippingRates: (address?: { state: string; postalCode: string }) => Promise<void>;
  
  // Discount
  discountCode: DiscountInfo | null;
  applyDiscountCode: (code: string) => Promise<boolean>;
  removeDiscountCode: () => void;
  
  // Checkout
  isCheckingOut: boolean;
  setIsCheckingOut: (value: boolean) => void;
  
  // Cart state
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'mkk-shopping-cart';
const SHIPPING_STORAGE_KEY = 'mkk-shipping-address'; // Only used to remove old data
const TAX_RATE = 0.06; // 6% Maryland tax

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddressState] = useState<ShippingAddress | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingRate, setSelectedShippingRateState] = useState<ShippingRate | null>(null);
  const [discountCode, setDiscountCode] = useState<DiscountInfo | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount (but NOT shipping address for security)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      
      // Remove any previously saved shipping address for security
      localStorage.removeItem(SHIPPING_STORAGE_KEY);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // NOTE: Shipping address is NOT saved to localStorage for security/privacy reasons
  // Customer must re-enter their information on each checkout

  const addItem = useCallback((item: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.variantId === item.variantId);
      if (existingItem) {
        return prevItems.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prevItems, item];
    });
    // Open cart when item is added
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.variantId === variantId ? { ...i, quantity } : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscountCode(null);
    setSelectedShippingRateState(null);
    setShippingAddressState(null); // Clear shipping address for security
  }, []);

  const setShippingAddress = useCallback((address: ShippingAddress) => {
    setShippingAddressState(address);
  }, []);

  const setSelectedShippingRate = useCallback((rate: ShippingRate) => {
    setSelectedShippingRateState(rate);
  }, []);

  // Calculate totals first (needed by callbacks below)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);

  // Fetch shipping rates based on address and cart weight
  const fetchShippingRates = useCallback(async (address?: { state: string; postalCode: string }) => {
    // Use provided address or fall back to stored shipping address
    const addressToUse = address || shippingAddress;
    
    if (!addressToUse || !addressToUse.state || !addressToUse.postalCode) {
      console.log('No valid address for shipping calculation');
      return;
    }

    // Don't calculate if cart is empty
    if (totalWeight <= 0) {
      console.log('Cart is empty, skipping shipping calculation');
      return;
    }

    try {
      console.log('Fetching shipping rates for:', {
        weight: totalWeight,
        state: addressToUse.state,
        postalCode: addressToUse.postalCode
      });

      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: totalWeight,
          state: addressToUse.state,
          postalCode: addressToUse.postalCode
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Shipping rates received:', data);
        setShippingRates(data.rates || []);
        
        // Auto-select cheapest rate
        if (data.rates && data.rates.length > 0) {
          const cheapest = data.rates.reduce((a: ShippingRate, b: ShippingRate) => 
            a.price < b.price ? a : b
          );
          setSelectedShippingRateState(cheapest);
        }
      } else {
        console.error('Failed to fetch shipping rates:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      // Fallback to weight-based default rates
      const weightLbs = totalWeight / 16;
      let defaultPrice = 9.00;
      if (weightLbs <= 1) defaultPrice = 5.50;
      else if (weightLbs <= 2) defaultPrice = 9.00;
      else if (weightLbs <= 3) defaultPrice = 11.00;
      else defaultPrice = 14.00;
      
      const defaultRates: ShippingRate[] = [
        { id: 'standard', name: 'Standard Shipping', price: defaultPrice, estimatedDays: '3-5 business days' },
        { id: 'express', name: 'Express Shipping', price: defaultPrice * 1.5, estimatedDays: '2-3 business days' }
      ];
      setShippingRates(defaultRates);
      setSelectedShippingRateState(defaultRates[0]);
    }
  }, [shippingAddress, totalWeight]);

  // Apply discount code
  const applyDiscountCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const currentSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: currentSubtotal })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setDiscountCode({
            code: data.code,
            type: data.type,
            value: data.value,
            applied: true
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error validating discount code:', error);
      return false;
    }
  }, [items]);

  const removeDiscountCode = useCallback(() => {
    setDiscountCode(null);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  
  // Calculate shipping based on selected rate
  const shipping = selectedShippingRate?.price || 0;
  
  // Calculate discount
  let discount = 0;
  if (discountCode?.applied) {
    switch (discountCode.type) {
      case 'percentage':
        discount = subtotal * (discountCode.value / 100);
        break;
      case 'fixed':
        discount = Math.min(discountCode.value, subtotal);
        break;
      case 'free_shipping':
        // Handled in shipping calculation
        break;
    }
  }
  
  // Calculate tax (on subtotal after discount)
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * TAX_RATE;
  
  // Calculate total
  const total = subtotal + shipping + tax - discount;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
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
        isCheckingOut,
        setIsCheckingOut,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

