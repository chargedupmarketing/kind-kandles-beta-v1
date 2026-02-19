'use client';

import { memo, useCallback } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/localStore';
import Image from 'next/image';
import Link from 'next/link';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

// Memoized cart item component to prevent unnecessary re-renders
interface CartItemProps {
  item: {
    variantId: string;
    title: string;
    variantTitle?: string;
    price: number;
    quantity: number;
    image?: string;
    handle: string;
  };
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
  onClose: () => void;
}

const CartItem = memo(function CartItem({ item, onUpdateQuantity, onRemove, onClose }: CartItemProps) {
  const handleDecrease = useCallback(() => {
    onUpdateQuantity(item.variantId, item.quantity - 1);
  }, [item.variantId, item.quantity, onUpdateQuantity]);

  const handleIncrease = useCallback(() => {
    onUpdateQuantity(item.variantId, item.quantity + 1);
  }, [item.variantId, item.quantity, onUpdateQuantity]);

  const handleRemove = useCallback(() => {
    onRemove(item.variantId);
  }, [item.variantId, onRemove]);

  return (
    <div className="flex gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      {/* Product Image */}
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

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.handle}`}
          onClick={onClose}
          className="font-semibold hover:text-pink-600 dark:hover:text-pink-400 transition-colors line-clamp-2"
        >
          {item.title}
        </Link>
        {item.variantTitle && item.variantTitle !== 'Default Title' && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {item.variantTitle}
          </p>
        )}
        <p className="text-pink-600 dark:text-pink-400 font-semibold mt-1">
          {formatPrice(item.price)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleDecrease}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-semibold">{item.quantity}</span>
          <button
            onClick={handleIncrease}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={handleRemove}
            className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeItem, updateQuantity, totalItems, subtotal, clearCart } = useCart();

  const handleClearCart = useCallback(() => {
    clearCart();
  }, [clearCart]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Cart Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart ({totalItems})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">Your cart is empty</p>
              <button
                onClick={onClose}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.variantId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  onClose={onClose}
                />
              ))}

              {/* Clear Cart Button */}
              {items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="w-full text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t dark:border-gray-800 p-4 space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Subtotal:</span>
              <span className="text-pink-600 dark:text-pink-400">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Shipping Note */}
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Shipping calculated at checkout
            </p>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Proceed to Checkout
            </Link>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Taxes and shipping calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default memo(Cart);

