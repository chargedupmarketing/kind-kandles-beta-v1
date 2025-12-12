'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  RefreshCw,
  Plus,
  Edit2,
  Package,
  AlertTriangle,
  CheckCircle,
  Filter,
  SortAsc
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
  inventory_quantity: number;
  status: 'active' | 'draft' | 'archived';
  images: { url: string }[];
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

  const fetchProducts = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      
      const response = await fetch(
        `/api/products?page=${currentPage}&limit=20${searchParam}`
      );
      const data = await response.json();

      let sortedProducts = data.products || [];
      
      // Client-side sorting
      switch (sortBy) {
        case 'title':
          sortedProducts.sort((a: Product, b: Product) => a.title.localeCompare(b.title));
          break;
        case 'price':
          sortedProducts.sort((a: Product, b: Product) => b.price - a.price);
          break;
        case 'stock':
          sortedProducts.sort((a: Product, b: Product) => a.inventory_quantity - b.inventory_quantity);
          break;
        // 'recent' is default from API
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'text-red-400 bg-red-500/20', label: 'Out of stock' };
    if (quantity <= 5) return { color: 'text-amber-400 bg-amber-500/20', label: 'Low stock' };
    return { color: 'text-green-400 bg-green-500/20', label: 'In stock' };
  };

  const sortOptions: { id: SortOption; label: string }[] = [
    { id: 'recent', label: 'Most Recent' },
    { id: 'title', label: 'Title A-Z' },
    { id: 'price', label: 'Price High-Low' },
    { id: 'stock', label: 'Stock Low-High' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filter Header */}
      <div className="sticky top-0 bg-slate-900 z-10 p-4 space-y-3 border-b border-slate-800">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-300"
            >
              <SortAsc className="h-4 w-4" />
              <span>{sortOptions.find(s => s.id === sortBy)?.label}</span>
            </button>

            {showSortMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSortChange(option.id)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === option.id
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
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
      </div>

      {/* Products */}
      <div className="flex-1 overflow-auto">
        {loading && products.length === 0 ? (
          <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-800 rounded-xl overflow-hidden animate-pulse">
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-slate-700" />
                    <div className="p-3">
                      <div className="h-4 w-full bg-slate-700 rounded mb-2" />
                      <div className="h-4 w-16 bg-slate-700 rounded" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center p-3">
                    <div className="w-16 h-16 bg-slate-700 rounded-lg" />
                    <div className="ml-3 flex-1">
                      <div className="h-4 w-full bg-slate-700 rounded mb-2" />
                      <div className="h-3 w-20 bg-slate-700 rounded" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-16 w-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No products found</h3>
            <p className="text-slate-400 text-sm text-center">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add your first product to get started'}
            </p>
          </div>
        ) : (
          <div className="p-4">
            {/* Refresh indicator */}
            {refreshing && (
              <div className="flex items-center justify-center py-2 mb-3">
                <RefreshCw className="h-5 w-5 text-teal-400 animate-spin" />
              </div>
            )}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.inventory_quantity);
                  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';

                  return (
                    <div
                      key={product.id}
                      className="bg-slate-800 rounded-xl overflow-hidden"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-slate-700">
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                          }}
                        />
                        {/* Stock Badge */}
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {product.inventory_quantity}
                        </div>
                        {/* Quick Edit Button */}
                        <button
                          onClick={() => handleQuickEdit(product)}
                          className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4 text-white" />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-white truncate mb-1">
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(product.price)}
                          </span>
                          {product.status !== 'active' && (
                            <span className="text-xs text-slate-400 capitalize">
                              {product.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.inventory_quantity);
                  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';

                  return (
                    <div
                      key={product.id}
                      className="bg-slate-800 rounded-xl p-3 flex items-center"
                    >
                      {/* Image */}
                      <div className="relative w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
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
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {product.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(product.price)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${stockStatus.color}`}>
                            {product.inventory_quantity} in stock
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleQuickEdit(product)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors ml-2"
                      >
                        <Edit2 className="h-5 w-5 text-slate-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-3 mt-4 text-sm text-teal-400 hover:text-teal-300 font-medium"
              >
                {loading ? 'Loading...' : 'Load more products'}
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

