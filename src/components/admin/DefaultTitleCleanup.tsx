'use client';

import { useState } from 'react';
import { Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CleanupChange {
  action: 'delete' | 'rename' | 'skip';
  productTitle: string;
  variantId?: string;
  oldTitle?: string;
  newTitle?: string;
  title?: string;
  inventoryQuantity?: number;
  totalVariants?: number;
  variantCount?: number;
  reason?: string;
}

interface CleanupResult {
  message: string;
  dryRun: boolean;
  totalFound: number;
  affectedProducts: number;
  deletedCount: number;
  updatedCount: number;
  skippedCount: number;
  changes: CleanupChange[];
}

export default function DefaultTitleCleanup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCleanup = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/products/cleanup-default-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });

      if (!response.ok) {
        throw new Error('Failed to run cleanup');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Clean Up "Default Title" Variants
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Remove or rename variants with "Default Title" to clean up your product catalog.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-2">What this does:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Finds all variants with title "Default Title"</li>
              <li>If product has multiple variants: <strong>Deletes</strong> the "Default Title" variant</li>
              <li>If it's the only variant: <strong>Renames</strong> it to match the product name</li>
              <li>Skips products where deletion would leave no variants</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => runCleanup(true)}
          disabled={loading}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5" />
              <span>Preview Changes</span>
            </>
          )}
        </button>

        <button
          onClick={() => runCleanup(false)}
          disabled={loading || !result || result.totalFound === 0}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Trash2 className="h-5 w-5" />
          <span>Execute Cleanup</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {result.dryRun ? 'Preview Results' : 'Cleanup Complete'}
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Found</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {result.totalFound}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">To Delete</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {result.deletedCount}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400">To Rename</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {result.updatedCount}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Skipped</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {result.skippedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Changes List */}
          {result.changes.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                  Changes ({result.changes.length})
                </h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {result.changes.map((change, index) => (
                  <div
                    key={index}
                    className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      {change.action === 'delete' && (
                        <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      {change.action === 'rename' && (
                        <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                      )}
                      {change.action === 'skip' && (
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {change.productTitle}
                        </p>
                        {change.action === 'delete' && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Delete "{change.title}" (QOH: {change.inventoryQuantity}) - {change.totalVariants} total variants
                          </p>
                        )}
                        {change.action === 'rename' && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Rename "{change.oldTitle}" → "{change.newTitle}"
                          </p>
                        )}
                        {change.action === 'skip' && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            {change.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

