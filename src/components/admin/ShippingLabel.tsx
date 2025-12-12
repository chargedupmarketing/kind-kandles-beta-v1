'use client';

import { useState } from 'react';
import {
  Printer,
  Download,
  ExternalLink,
  Package,
  CheckCircle,
  RefreshCw,
  FileText,
  Maximize2,
} from 'lucide-react';

interface ShippingLabelProps {
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  service: string;
  orderNumber?: string;
  onClose?: () => void;
}

export default function ShippingLabel({
  labelUrl,
  trackingNumber,
  trackingUrl,
  carrier,
  service,
  orderNumber,
  onClose,
}: ShippingLabelProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    
    // Open label in new window for printing
    const printWindow = window.open(labelUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(labelUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `label-${orderNumber || trackingNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading label:', error);
      // Fallback: open in new tab
      window.open(labelUrl, '_blank');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Shipping Label Ready</h3>
              {orderNumber && (
                <p className="text-sm text-teal-100">Order {orderNumber}</p>
              )}
            </div>
          </div>
          <CheckCircle className="h-6 w-6" />
        </div>
      </div>

      {/* Label Info */}
      <div className="p-4 space-y-4">
        {/* Carrier & Service */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Carrier</p>
            <p className="font-medium text-gray-900 dark:text-white uppercase">
              {carrier}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Service</p>
            <p className="font-medium text-gray-900 dark:text-white">{service}</p>
          </div>
        </div>

        {/* Tracking Number */}
        <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Tracking Number
          </p>
          <div className="flex items-center justify-between">
            <p className="font-mono font-medium text-gray-900 dark:text-white">
              {trackingNumber}
            </p>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm"
            >
              Track
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Label Preview */}
        {showPreview && (
          <div className="border dark:border-slate-700 rounded-lg overflow-hidden">
            <iframe
              src={labelUrl}
              className="w-full h-[400px]"
              title="Shipping Label Preview"
            />
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
          >
            {isPrinting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Print Label
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 font-medium"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex items-center justify-between pt-2 border-t dark:border-slate-700">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
          >
            {showPreview ? (
              <>
                <FileText className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Preview Label
              </>
            )}
          </button>
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
          >
            Open in New Tab
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

// Compact version for list views
export function ShippingLabelCompact({
  labelUrl,
  trackingNumber,
  trackingUrl,
  carrier,
}: {
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-900 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase">{carrier}</p>
        <p className="font-mono text-sm truncate">{trackingNumber}</p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded"
          title="Track Package"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={labelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded"
          title="Print Label"
        >
          <Printer className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

