import Link from 'next/link';
import { memo, useMemo, useCallback } from 'react';
import LazyImage from './LazyImage';
import InventoryAlert from './InventoryAlert';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  badge?: string;
  href: string;
  description?: string;
  scentProfile?: 'fresh' | 'floral' | 'woodsy' | 'sweet' | 'citrus' | 'herbal' | 'earthy';
  burnTime?: string;
  isCandle?: boolean;
  stockLevel?: number;
  isLimitedEdition?: boolean;
  isTrending?: boolean;
}

const ProductCard = memo(({ 
  id, 
  name, 
  price, 
  originalPrice, 
  image, 
  badge, 
  href, 
  description,
  scentProfile,
  burnTime,
  isCandle = false,
  stockLevel,
  isLimitedEdition = false,
  isTrending = false
}: ProductCardProps) => {
  
  const getScentBadgeClass = useCallback((scent: string) => {
    switch (scent) {
      case 'fresh': return 'scent-badge-fresh';
      case 'floral': return 'scent-badge-floral';
      case 'woodsy': return 'scent-badge-woodsy';
      case 'sweet': return 'scent-badge-sweet';
      default: return 'scent-badge';
    }
  }, []);

  const discountPercentage = useMemo(() => {
    if (!originalPrice) return null;
    const original = parseFloat(originalPrice.replace('$', ''));
    const current = parseFloat(price.replace('From $', '').replace('$', ''));
    return Math.round(((original - current) / original) * 100);
  }, [originalPrice, price]);
  return (
    <div className={`${isCandle ? 'card-candle' : 'card'} group relative`}>
      <Link href={href}>
        <div className="relative overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-amber-50 to-orange-50 rounded-t-lg flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
            {image && image !== '/api/placeholder/300/300' ? (
              <LazyImage
                src={image}
                alt={name}
                width={300}
                height={300}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-amber-400">
                <div className="text-4xl mb-2">🕯️</div>
                <span className="text-sm font-medium">Product Image</span>
              </div>
            )}
          </div>
          
          {/* Enhanced Badge System */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {badge && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                badge === 'Sale' 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse' 
                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg'
              }`}>
                {badge}
              </span>
            )}
            {isLimitedEdition && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
                Limited Edition
              </span>
            )}
            {isTrending && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                🔥 Trending
              </span>
            )}
            {scentProfile && (
              <span className={`${getScentBadgeClass(scentProfile)} capitalize shadow-sm`}>
                {scentProfile}
              </span>
            )}
          </div>

          {/* Stock Level Indicator */}
          {stockLevel && stockLevel <= 5 && (
            <div className="absolute top-3 right-3">
              <InventoryAlert 
                stockLevel={stockLevel}
                variant="minimal"
              />
            </div>
          )}

          {/* Candle Flame Effect on Hover */}
          {isCandle && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-orange-400 flame-flicker">🔥</div>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-white">
          {/* Product Title */}
          <h3 className="serif-font text-lg font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2 leading-tight">
            {name}
          </h3>
          
          {/* Burn Time for Candles */}
          {isCandle && burnTime && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-amber-600">⏱️</span>
              <span className="text-xs text-gray-600 font-medium">{burnTime} burn time</span>
            </div>
          )}
          
          {/* Description */}
          {description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
          
          {/* Pricing */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900 serif-font">{price}</span>
              {originalPrice && (
                <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
              )}
            </div>
            {discountPercentage && (
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Save {discountPercentage}%
              </span>
            )}
          </div>
          
          {/* Enhanced CTA Button */}
          <button className={`w-full text-center transition-all duration-300 ${
            isCandle 
              ? 'btn-candle glow-pulse' 
              : 'btn-primary'
          }`}>
            {isCandle ? '🕯️ Light Up Your Space' : '✨ Choose Options'}
          </button>
        </div>
      </Link>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
