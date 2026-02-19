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
  AlertCircle,
  Boxes,
  Plus,
  Minus,
  Save,
  X,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';
import type { AdminSection } from './MobileAppShell';
import QuickEditProduct from './QuickEditProduct';

interface MobileProductsProps {
  onNavigate: (section: AdminSection) => void;
}

interface ProductVariant {
  id: string;
  inventory_quantity: number;
  price: number;
  sku?: string;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  price: number;
  compare_at_price?: number;
  status?: 'active' | 'draft' | 'archived';
  images?: { url: string }[];
  variants?: ProductVariant[];
  product_type?: string;
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
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<{ [productId: string]: number }>({});
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [stockSuccessMessage, setStockSuccessMessage] = useState('');

  // Helper to get inventory from product variants
  const getInventory = (product: Product): number => {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);
  };

  const fetchProducts = useCallback(async (reset = false) => {
    try {
      // Use admin API to get full product data including variants with inventory
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });
      const data = await response.json();

      let sortedProducts = data.products || [];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        sortedProducts = sortedProducts.filter((p: Product) => 
          p.title.toLowerCase().includes(query) ||
          p.handle.toLowerCase().includes(query) ||
          p.variants?.[0]?.sku?.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'title':
          sortedProducts.sort((a: Product, b: Product) => a.title.localeCompare(b.title));
          break;
        case 'price':
          sortedProducts.sort((a: Product, b: Product) => (b.price || 0) - (a.price || 0));
          break;
        case 'stock':
          sortedProducts.sort((a: Product, b: Product) => {
            const aStock = a.variants?.[0]?.inventory_quantity || 0;
            const bStock = b.variants?.[0]?.inventory_quantity || 0;
            return aStock - bStock;
          });
          break;
      }

      // Apply pagination
      const currentPage = reset ? 1 : page;
      const pageSize = 20;
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedProducts = sortedProducts.slice(startIndex, startIndex + pageSize);

      if (reset) {
        setProducts(paginatedProducts);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...paginatedProducts]);
      }
      
      setHasMore(startIndex + pageSize < sortedProducts.length);
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

  // Stock Management Functions
  const openStockModal = async () => {
    hapticMedium();
    // Fetch all products for stock management
    try {
      const response = await fetch('/api/admin/products', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      const data = await response.json();
      const prods = data.products || [];
      setAllProducts(prods);
      
      // Initialize stock updates with current values
      const initialStock: { [productId: string]: number } = {};
      prods.forEach((product: Product) => {
        initialStock[product.id] = product.variants?.[0]?.inventory_quantity || 0;
      });
      setStockUpdates(initialStock);
      setShowStockModal(true);
    } catch (error) {
      console.error('Error fetching products for stock:', error);
    }
  };

  const updateStockValue = (productId: string, value: number) => {
    hapticLight();
    setStockUpdates(prev => ({
      ...prev,
      [productId]: Math.max(0, value)
    }));
  };

  const adjustStock = (productId: string, adjustment: number) => {
    hapticLight();
    setStockUpdates(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + adjustment)
    }));
  };

  const getStockFilteredProducts = () => {
    return allProducts.filter(product => {
      const currentStock = product.variants?.[0]?.inventory_quantity || 0;
      if (stockFilter === 'low') return currentStock > 0 && currentStock <= 5;
      if (stockFilter === 'out') return currentStock === 0;
      return true;
    });
  };

  const getChangedStockProducts = () => {
    return allProducts.filter(product => {
      const originalStock = product.variants?.[0]?.inventory_quantity || 0;
      const newStock = stockUpdates[product.id];
      return newStock !== undefined && newStock !== originalStock;
    });
  };

  const saveStockUpdates = async () => {
    const changedProducts = getChangedStockProducts();
    if (changedProducts.length === 0) {
      setStockSuccessMessage('No changes to save');
      setTimeout(() => setStockSuccessMessage(''), 3000);
      return;
    }

    setIsSavingStock(true);
    let successCount = 0;
    let errorCount = 0;

    for (const product of changedProducts) {
      try {
        const response = await fetch(`/api/admin/products/${product.id}/stock`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({
            inventory_quantity: stockUpdates[product.id]
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error('Error updating stock:', error);
        errorCount++;
      }
    }

    setIsSavingStock(false);
    hapticSuccess();
    setShowStockModal(false);

    if (errorCount === 0) {
      setStockSuccessMessage(`Updated ${successCount} products!`);
    } else {
      setStockSuccessMessage(`Updated ${successCount} (${errorCount} failed)`);
    }
    setTimeout(() => setStockSuccessMessage(''), 5000);
    
    fetchProducts(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Success Message */}
      {stockSuccessMessage && (
        <div className="fixed top-4 left-4 right-4 z-[60] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">{stockSuccessMessage}</span>
        </div>
      )}

      {/* Compact Header */}
      <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        {/* Manage Stock Button - Full Width */}
        <div className="px-3 pt-2 pb-1">
          <button
            onClick={openStockModal}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl hover:bg-teal-700 active:scale-[0.98] transition-all shadow-md"
          >
            <Boxes className="h-5 w-5" />
            <span className="text-sm font-semibold">Manage Stock</span>
          </button>
        </div>

        <div className="flex items-center justify-between px-3 py-2">
          {/* View Mode & Sort */}
          <div className="flex items-center space-x-2">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center space-x-1 px-2 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-xs text-gray-600 dark:text-slate-300"
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
                  <div className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleSortChange(option.id)}
                        className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                          sortBy === option.id
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
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
              showSearch ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
            }`}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Collapsible Search */}
        {showSearch && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
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
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden animate-pulse shadow-sm">
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-gray-200 dark:bg-slate-700" />
                    <div className="p-2">
                      <div className="h-3 w-full bg-gray-200 dark:bg-slate-700 rounded mb-1" />
                      <div className="h-3 w-10 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center p-2">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                    <div className="ml-2 flex-1">
                      <div className="h-3 w-full bg-gray-200 dark:bg-slate-700 rounded mb-1" />
                      <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No products found</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
              {searchQuery ? 'Try different search' : 'Add products to get started'}
            </p>
          </div>
        ) : (
          <div className="p-3">
            {refreshing && (
              <div className="flex items-center justify-center py-1 mb-2">
                <RefreshCw className="h-4 w-4 text-teal-600 dark:text-teal-400 animate-spin" />
              </div>
            )}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-2">
                {products.map((product) => {
                  const inventoryQty = product.variants?.[0]?.inventory_quantity ?? 0;
                  const stockStatus = getStockStatus(inventoryQty);
                  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleQuickEdit(product)}
                      className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden text-left active:scale-[0.98] transition-transform shadow-sm border border-gray-100 dark:border-slate-700"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-gray-100 dark:bg-slate-700">
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
                        <div className="absolute top-1 right-1 p-1 bg-white/80 dark:bg-slate-800/80 rounded shadow-sm">
                          <Edit2 className="h-2.5 w-2.5 text-gray-600 dark:text-slate-300" />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-2">
                        <h3 className="text-[10px] font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight mb-1">
                          {product.title}
                        </h3>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
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
                  const inventoryQty = product.variants?.[0]?.inventory_quantity ?? 0;
                  const stockStatus = getStockStatus(inventoryQty);
                  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleQuickEdit(product)}
                      className="w-full bg-white dark:bg-slate-800 rounded-lg p-2 flex items-center text-left active:scale-[0.99] transition-transform shadow-sm border border-gray-100 dark:border-slate-700"
                    >
                      {/* Image */}
                      <div className="relative w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
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
                        <h3 className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {product.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {formatCurrency(product.price)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${stockStatus.color}`}>
                            {inventoryQty} in stock
                          </span>
                        </div>
                      </div>

                      {/* Edit */}
                      <Edit2 className="h-4 w-4 text-gray-400 dark:text-slate-500 ml-2" />
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
                className="w-full py-2.5 mt-3 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
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

      {/* Manage Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div 
            className="bg-white dark:bg-slate-800 w-full max-h-[90vh] rounded-t-2xl overflow-hidden animate-slide-up shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-teal-500 to-emerald-500">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-white" />
                <h2 className="text-lg font-bold text-white">Manage Stock</h2>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
              {[
                { value: 'all', label: 'All', count: allProducts.length },
                { value: 'low', label: 'Low', count: allProducts.filter(p => (p.variants?.[0]?.inventory_quantity || 0) > 0 && (p.variants?.[0]?.inventory_quantity || 0) <= 5).length },
                { value: 'out', label: 'Out', count: allProducts.filter(p => (p.variants?.[0]?.inventory_quantity || 0) === 0).length },
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => {
                    hapticLight();
                    setStockFilter(filter.value as typeof stockFilter);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    stockFilter === filter.value
                      ? 'bg-teal-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>

            {/* Pending Changes Indicator */}
            {getChangedStockProducts().length > 0 && (
              <div className="px-3 py-2 bg-teal-50 dark:bg-teal-900/30 border-b border-teal-100 dark:border-teal-800/50">
                <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                  {getChangedStockProducts().length} pending changes
                </span>
              </div>
            )}

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-900">
              {getStockFilteredProducts().map((product) => {
                const originalStock = product.variants?.[0]?.inventory_quantity || 0;
                const newStock = stockUpdates[product.id] ?? originalStock;
                const hasChanged = newStock !== originalStock;
                const stockStatus = newStock === 0 ? 'out' : newStock <= 5 ? 'low' : 'good';
                const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';
                
                return (
                  <div 
                    key={product.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      hasChanged 
                        ? 'border-teal-300 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/30' 
                        : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {product.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                          stockStatus === 'out' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : stockStatus === 'low'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}>
                          {stockStatus === 'out' ? 'Out' : stockStatus === 'low' ? 'Low' : 'OK'}
                        </span>
                        {hasChanged && (
                          <span className="flex items-center text-[9px] text-teal-600 dark:text-teal-400 font-medium">
                            <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" />
                            {originalStock}→{newStock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustStock(product.id, -1)}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 transition-colors"
                        disabled={newStock <= 0}
                      >
                        <Minus className="h-3.5 w-3.5 text-gray-600 dark:text-slate-300" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={newStock}
                        onChange={(e) => updateStockValue(product.id, parseInt(e.target.value) || 0)}
                        className={`w-12 px-1 py-1 text-center border rounded-lg text-sm font-bold ${
                          hasChanged 
                            ? 'border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-gray-900 dark:text-white' 
                            : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white'
                        }`}
                      />
                      <button
                        onClick={() => adjustStock(product.id, 1)}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5 text-gray-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {getStockFilteredProducts().length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No products match this filter</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 py-3 px-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-xl font-medium text-sm active:scale-[0.98] transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={saveStockUpdates}
                  disabled={isSavingStock || getChangedStockProducts().length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {isSavingStock ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save ({getChangedStockProducts().length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
