'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  MessageSquare,
  Search
} from 'lucide-react';

export interface OrderFiltersState {
  dateFrom: string;
  dateTo: string;
  status: string[];
  products: string[];
  minTotal: string;
  maxTotal: string;
  hasNotes: boolean;
  lowInventory: boolean;
  searchQuery: string;
}

interface OrderFiltersProps {
  filters: OrderFiltersState;
  onFiltersChange: (filters: OrderFiltersState) => void;
  products?: { id: string; title: string }[];
  activeFilterCount?: number;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-500' },
  { value: 'paid', label: 'Paid', color: 'bg-blue-500' },
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'shipped', label: 'Shipped', color: 'bg-green-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-700' },
  { value: 'fulfilled', label: 'Fulfilled', color: 'bg-emerald-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-orange-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-500' },
];

const DEFAULT_FILTERS: OrderFiltersState = {
  dateFrom: '',
  dateTo: '',
  status: [],
  products: [],
  minTotal: '',
  maxTotal: '',
  hasNotes: false,
  lowInventory: false,
  searchQuery: '',
};

export default function OrderFilters({
  filters,
  onFiltersChange,
  products = [],
  activeFilterCount = 0,
}: OrderFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const updateFilter = useCallback(<K extends keyof OrderFiltersState>(
    key: K,
    value: OrderFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const toggleStatus = useCallback((status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilter('status', newStatuses);
  }, [filters.status, updateFilter]);

  const toggleProduct = useCallback((productId: string) => {
    const newProducts = filters.products.includes(productId)
      ? filters.products.filter(p => p !== productId)
      : [...filters.products, productId];
    updateFilter('products', newProducts);
  }, [filters.products, updateFilter]);

  const clearFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  const filteredProducts = useMemo(() => {
    if (!productSearchQuery) return products.slice(0, 10);
    return products
      .filter(p => p.title.toLowerCase().includes(productSearchQuery.toLowerCase()))
      .slice(0, 10);
  }, [products, productSearchQuery]);

  const hasActiveFilters = activeFilterCount > 0 || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.status.length > 0 || 
    filters.products.length > 0 || 
    filters.minTotal || 
    filters.maxTotal || 
    filters.hasNotes || 
    filters.lowInventory;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-900 text-white rounded-full">
              {activeFilterCount || 'Active'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFilters();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded"
            >
              Clear all
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Filter Panel */}
      {expanded && (
        <div className="px-4 py-4 border-t border-gray-200 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                placeholder="Order #, customer name, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.value}
                  onClick={() => toggleStatus(status.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filters.status.includes(status.value)
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Total Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Min Total
              </label>
              <input
                type="number"
                value={filters.minTotal}
                onChange={(e) => updateFilter('minTotal', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Max Total
              </label>
              <input
                type="number"
                value={filters.maxTotal}
                onChange={(e) => updateFilter('maxTotal', e.target.value)}
                placeholder="999.99"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Product Filter */}
          {products.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Package className="w-4 h-4 inline mr-1" />
                Products
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowProductSearch(!showProductSearch)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  <span className="text-gray-600">
                    {filters.products.length > 0
                      ? `${filters.products.length} product${filters.products.length > 1 ? 's' : ''} selected`
                      : 'Select products...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showProductSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-hidden">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => toggleProduct(product.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                            filters.products.includes(product.id) ? 'bg-gray-100' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.products.includes(product.id)}
                            readOnly
                            className="rounded border-gray-300"
                          />
                          <span className="truncate">{product.title}</span>
                        </button>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                          No products found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Products Tags */}
              {filters.products.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.products.map((productId) => {
                    const product = products.find(p => p.id === productId);
                    return (
                      <span
                        key={productId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {product?.title || productId}
                        <button
                          onClick={() => toggleProduct(productId)}
                          className="hover:text-gray-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Toggle Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasNotes}
                onChange={(e) => updateFilter('hasNotes', e.target.checked)}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Has notes</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.lowInventory}
                onChange={(e) => updateFilter('lowInventory', e.target.checked)}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-700">Low inventory alerts</span>
            </label>
          </div>
        </div>
      )}

      {/* Click outside to close product search */}
      {showProductSearch && (
        <div 
          className="fixed inset-0 z-[5]" 
          onClick={() => setShowProductSearch(false)}
        />
      )}
    </div>
  );
}

// Quick filter buttons component
export function QuickFilters({
  onFilterChange,
  currentStatus,
}: {
  onFilterChange: (status: string[]) => void;
  currentStatus: string[];
}) {
  const quickFilters = [
    { label: 'All', status: [] },
    { label: 'Unfulfilled', status: ['pending', 'paid', 'processing'] },
    { label: 'Ready to Ship', status: ['paid'] },
    { label: 'Shipped', status: ['shipped'] },
    { label: 'On Hold', status: ['on_hold'] },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {quickFilters.map((filter) => {
        const isActive = JSON.stringify(filter.status.sort()) === JSON.stringify(currentStatus.sort());
        return (
          <button
            key={filter.label}
            onClick={() => onFilterChange(filter.status)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

// Export default filters for use in parent component
export { DEFAULT_FILTERS };
