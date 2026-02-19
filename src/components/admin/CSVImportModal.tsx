'use client';

import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';

interface ImportResult {
  orderNumber: string;
  trackingNumber: string;
  status: 'success' | 'error';
  message?: string;
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (results: { updated: number; errors: string[] }) => void;
}

interface ParsedRow {
  orderNumber: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
}

export default function CSVImportModal({ isOpen, onClose, onImportComplete }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setParseError(null);
    setImporting(false);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Find column index by possible names
  const findColumnIndex = (header: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = header.findIndex(col => 
        col.toLowerCase().trim() === name.toLowerCase()
      );
      if (index !== -1) return index;
    }
    return -1;
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          setParseError('CSV file is empty or has no data rows');
          setParsedData([]);
          return;
        }

        const header = parseCSVLine(lines[0]);
        
        // Find required columns
        const orderNumberIndex = findColumnIndex(header, [
          'Order Number', 'Order ID', 'order_number', 'order_id', 'Order #', 'OrderNumber'
        ]);
        const trackingNumberIndex = findColumnIndex(header, [
          'Tracking Number', 'Tracking', 'tracking_number', 'tracking', 'TrackingNumber'
        ]);
        const trackingUrlIndex = findColumnIndex(header, [
          'Tracking URL', 'Tracking Link', 'tracking_url', 'tracking_link', 'URL'
        ]);
        const carrierIndex = findColumnIndex(header, [
          'Carrier', 'Shipping Carrier', 'carrier', 'Ship Via', 'Service'
        ]);

        if (orderNumberIndex === -1) {
          setParseError('CSV must contain an "Order Number" column');
          setParsedData([]);
          return;
        }

        if (trackingNumberIndex === -1) {
          setParseError('CSV must contain a "Tracking Number" column');
          setParsedData([]);
          return;
        }

        const parsed: ParsedRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);
          if (row.length < 2) continue;

          const orderNumber = row[orderNumberIndex]?.trim();
          const trackingNumber = row[trackingNumberIndex]?.trim();

          if (!orderNumber || !trackingNumber) continue;

          parsed.push({
            orderNumber,
            trackingNumber,
            trackingUrl: trackingUrlIndex !== -1 ? row[trackingUrlIndex]?.trim() : undefined,
            carrier: carrierIndex !== -1 ? row[carrierIndex]?.trim() : undefined,
          });
        }

        if (parsed.length === 0) {
          setParseError('No valid data rows found in CSV');
          setParsedData([]);
          return;
        }

        setParsedData(parsed);
      } catch (err) {
        setParseError('Failed to parse CSV file');
        setParsedData([]);
      }
    };

    reader.onerror = () => {
      setParseError('Failed to read file');
      setParsedData([]);
    };

    reader.readAsText(selectedFile);
  }, []);

  const handleImport = useCallback(async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setImportResults(null);

    try {
      // Create FormData with CSV content
      const csvContent = [
        'Order Number,Tracking Number,Tracking URL,Carrier',
        ...parsedData.map(row => 
          `${row.orderNumber},${row.trackingNumber},${row.trackingUrl || ''},${row.carrier || ''}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'tracking-import.csv');

      const response = await fetch('/api/admin/orders/import-tracking', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token',
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      // Build results for display
      const results: ImportResult[] = [];
      
      if (result.details) {
        for (const detail of result.details) {
          results.push({
            orderNumber: detail.orderNumber,
            trackingNumber: detail.trackingNumber,
            status: 'success',
          });
        }
      }

      if (result.errors) {
        for (const error of result.errors) {
          // Extract order number from error message if possible
          const match = error.match(/Order "([^"]+)"/);
          results.push({
            orderNumber: match ? match[1] : 'Unknown',
            trackingNumber: '',
            status: 'error',
            message: error,
          });
        }
      }

      setImportResults(results);
      onImportComplete({
        updated: result.updated || 0,
        errors: result.errors || [],
      });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [parsedData, onImportComplete]);

  const downloadTemplate = useCallback(() => {
    const template = `Order Number,Tracking Number,Tracking URL,Carrier
#1001,1Z999AA10123456784,https://www.ups.com/track?tracknum=1Z999AA10123456784,UPS
#1002,9400111899223456789012,https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223456789012,USPS`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tracking-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Import Tracking Numbers</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">CSV Format</h3>
            <p className="text-sm text-blue-800 mb-2">
              Upload a CSV file with tracking numbers from Pirate Ship. Required columns:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li><strong>Order Number</strong> - Must match your order numbers</li>
              <li><strong>Tracking Number</strong> - The tracking number from the carrier</li>
              <li><strong>Tracking URL</strong> (optional) - Link to track the shipment</li>
              <li><strong>Carrier</strong> (optional) - UPS, USPS, FedEx, etc.</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-3 inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
            >
              <Download className="w-4 h-4" />
              Download template CSV
            </button>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {file ? (
                <>
                  <FileText className="w-10 h-10 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                  <span className="text-xs text-gray-500">Click to select a different file</span>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Click to upload CSV file
                  </span>
                  <span className="text-xs text-gray-500">or drag and drop</span>
                </>
              )}
            </label>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{parseError}</p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && !importResults && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Preview ({parsedData.length} orders)
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Order #</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Tracking #</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Carrier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.slice(0, 50).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">{row.orderNumber}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono text-xs">
                            {row.trackingNumber}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{row.carrier || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 50 && (
                  <div className="px-3 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                    Showing first 50 of {parsedData.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Import Results</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Order #</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {importResults.map((result, index) => (
                        <tr key={index} className={result.status === 'error' ? 'bg-red-50' : 'bg-green-50'}>
                          <td className="px-3 py-2">
                            {result.status === 'success' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-900">{result.orderNumber}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {result.status === 'success' 
                              ? `Tracking: ${result.trackingNumber}`
                              : result.message
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <span className="text-green-700">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  {importResults.filter(r => r.status === 'success').length} successful
                </span>
                <span className="text-red-700">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {importResults.filter(r => r.status === 'error').length} failed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          {importResults ? (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={parsedData.length === 0 || importing}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {parsedData.length} Orders
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
