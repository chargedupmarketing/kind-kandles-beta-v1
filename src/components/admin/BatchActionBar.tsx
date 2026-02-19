'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Truck, 
  CheckCircle, 
  Loader2,
  ChevronDown,
  Package,
  FileText
} from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
  onExport: (ids: string[], format: 'pirateship' | 'detailed') => Promise<void>;
  onUpdateStatus: (ids: string[], status: string) => Promise<void>;
  onBatchAction?: (action: string, ids: string[]) => Promise<void>;
}

export default function BatchActionBar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onExport,
  onUpdateStatus,
  onBatchAction,
}: BatchActionBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleExport = async (format: 'pirateship' | 'detailed') => {
    setLoading('export');
    setShowExportMenu(false);
    try {
      await onExport(selectedIds, format);
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setLoading(`status-${status}`);
    setShowStatusMenu(false);
    try {
      await onUpdateStatus(selectedIds, status);
    } finally {
      setLoading(null);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-40 animate-slide-up">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-medium">
            {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={loading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'export' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-white text-gray-900 rounded-lg shadow-lg overflow-hidden min-w-[200px]">
                <button
                  onClick={() => handleExport('pirateship')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                >
                  <Truck className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Pirate Ship Format</p>
                    <p className="text-xs text-gray-500">For shipping label import</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('detailed')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left border-t"
                >
                  <FileText className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium">Detailed Export</p>
                    <p className="text-xs text-gray-500">Full order information</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Status Update Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={loading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading?.startsWith('status') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              Update Status
              <ChevronDown className="w-4 h-4" />
            </button>

            {showStatusMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-white text-gray-900 rounded-lg shadow-lg overflow-hidden min-w-[180px]">
                <button
                  onClick={() => handleUpdateStatus('processing')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Mark as Processing
                </button>
                <button
                  onClick={() => handleUpdateStatus('shipped')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left border-t"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Mark as Shipped
                </button>
                <button
                  onClick={() => handleUpdateStatus('on_hold')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left border-t"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Put on Hold
                </button>
              </div>
            )}
          </div>

          {/* Mark Complete */}
          <button
            onClick={() => handleUpdateStatus('fulfilled')}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading === 'status-fulfilled' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Mark Fulfilled
          </button>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showExportMenu || showStatusMenu) && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => {
            setShowExportMenu(false);
            setShowStatusMenu(false);
          }}
        />
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// Checkbox component for order selection
export function OrderCheckbox({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="relative flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`
        w-5 h-5 border-2 rounded transition-all
        ${checked 
          ? 'bg-gray-900 border-gray-900' 
          : 'bg-white border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        peer-focus:ring-2 peer-focus:ring-gray-900 peer-focus:ring-offset-2
      `}>
        {checked && (
          <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </label>
  );
}

// Select all checkbox with indeterminate state
export function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  label = 'Select all',
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`
          w-5 h-5 border-2 rounded transition-all
          ${checked || indeterminate
            ? 'bg-gray-900 border-gray-900' 
            : 'bg-white border-gray-300 hover:border-gray-400'
          }
          peer-focus:ring-2 peer-focus:ring-gray-900 peer-focus:ring-offset-2
        `}>
          {checked && !indeterminate && (
            <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {indeterminate && (
            <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
              <rect x="4" y="9" width="12" height="2" rx="1" />
            </svg>
          )}
        </div>
      </div>
      {label}
    </label>
  );
}
