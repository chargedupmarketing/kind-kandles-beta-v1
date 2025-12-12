'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  RefreshCw,
  Edit2,
  Package,
  SortAsc,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import type { AdminSection } from './MobileAppShell';
import QuickEditProduct from './QuickEditProduct';

interface MobileProductsProps {
  onNavigate: (section: AdminSection) => void;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  price: number;
  compare_at_price?: number;
  inventory_quantity?: number;
  status?: 'active' | 'draft' | 'archived';
  images?: { url: string }[];
  type?: string;
  vendor?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'title' | 'price' | 'stock';

export default function MobileProducts({ onNavigate }: MobileProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const fetchProducts = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      
      const response = await fetch(
        `/api/products?page=${currentPage}&limit=20${searchParam}`
      );
      const data = await response.json();

      let sortedProducts = data.products || [];
      
      switch (sortBy) {
        case 'title':
          sortedProducts.sort((a: Product, b: Product) => a.title.localeCompare(b.title));
          break;
        case 'price':
          sortedProducts.sort((a: Product, b: Product) => b.price - a.price);
          break;
        case 'stock':
          sortedProducts.sort((a: Product, b: Product) => (a.inventory_quantity ?? 0) - (b.inventory_quantity ?? 0));
          break;
      }

      if (reset) {
        setProducts(sortedProducts);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...sortedProducts]);
      }
      
      setHasMore(sortedProducts.length === 20);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, sortBy, page]);

  useEffect(() => {
    setLoading(true);
    fetchProducts(true);
  }, [searchQuery, sortBy]);

  const handleRefresh = async () => {
    hapticMedium();
    setRefreshing(true);
    await fetchProducts(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchProducts(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    hapticLight();
    setViewMode(mode);
  };

  const handleSortChange = (sort: SortOption) => {
    hapticLight();
    setSortBy(sort);
    setShowSortMenu(false);
  };

  const handleQuickEdit = (product: Product) => {
    hapticMedium();
    setEditingProduct(product);
  };

  const handleEditSuccess = () => {
    setEditingProduct(null);
    fetchProducts(true);
  };

  const formatCurrency = (amount: number | undefined | null) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  };

  const getStockStatus = (quantity: number | undefined | null) => {
    const qty = quantity ?? 0;
    if (qty === 0) return { color: 'bg-red-500 text-white', label: '0' };
    if (qty <= 5) return { color: 'bg-amber-500 text-white', label: String(qty) };
    return { color: 'bg-green-100 text-green-700', label: String(qty) };
  };

  const sortOptions: { id: SortOption; label: string; short: string }[] = [
    { id: 'recent', label: 'Most Recent', short: 'Recent' },
    { id: 'title', label: 'Title A-Z', short: 'A-Z' },
    { id: 'price', label: 'Price High-Low', short: 'Price' },
    { id: 'stock', label: 'Stock Low-High', short: 'Stock' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Compact Header */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          {/* View Mode & Sort */}
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center space-x-1 px-2 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600"
              >
                <SortAsc className="h-3.5 w-3.5" />
                <span>{sortOptions.find(s => s.id === sortBy)?.short}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>

              {showSortMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleSortChange(option.id)}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                          sortBy === option.id
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSearch ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Collapsible Search */}
        {showSearch && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="flex-1 overflow-auto">
        {loading && products.length === 0 ? (
          <div className={`p-3 ${viewMode === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden animate-pulse shadow-sm">
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-2">
                      <div className="h-3 w-full bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-10 bg-gray-200 rounded" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center p-2">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div className="ml-2 flex-1">
                      <div className="h-3 w-full bg-gray-200 rounded mb-1" />
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No products found</h3>
            <p className="text-xs text-gray-500 text-center">
              {searchQuery ? 'Try different search' : 'Add products to get started'}
            </p>
          </div>
        ) : (
          <div className="p-3">
            {refreshing && (
              <div className="flex items-center justify-center py-1 mb-2">
                <RefreshCw className="h-4 w-4 text-teal-600 animate-spin" />
              </div>
            )}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-2">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.inventory_quantity);
                  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleQuickEdit(product)}
                      className="bg-white rounded-lg overflow-hidden text-left active:scale-[0.98] transition-transform shadow-sm border border-gray-100"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                        {/* Stock Badge */}
                        <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                        {/* Edit Icon */}
                        <div className="absolute top-1 right-1 p-1 bg-white/80 rounded shadow-sm">
                          <Edit2 className="h-2.5 w-2.5 text-gray-600" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-2">
                        <h3 className="text-[10px] font-medium text-gray-900 line-clamp-2 leading-tight mb-1">
                          {product.title}
                        </h3>
                        <span className="text-xs font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.inventory_quantity);
                  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleQuickEdit(product)}
                      className="w-full bg-white rounded-lg p-2 flex items-center text-left active:scale-[0.99] transition-transform shadow-sm border border-gray-100"
                    >
                      {/* Image */}
                      <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="ml-2.5 flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-gray-900 truncate">
                          {product.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs font-bold text-gray-900">
                            {formatCurrency(product.price)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${stockStatus.color}`}>
                            {product.inventory_quantity ?? 0} in stock
                          </span>
                        </div>
                      </div>

                      {/* Edit */}
                      <Edit2 className="h-4 w-4 text-gray-400 ml-2" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-2.5 mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Edit Modal */}
      {editingProduct && (
        <QuickEditProduct
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
