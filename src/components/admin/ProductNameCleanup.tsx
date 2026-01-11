'use client';

import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle, RotateCcw, Eye, Play, Download, Upload } from 'lucide-react';

interface PreviewItem {
  id: string;
  originalTitle: string;
  cleanedTitle: string;
  originalHandle: string;
  newHandle: string;
  variantCount: number;
}

interface BackupData {
  id: string;
  originalTitle: string;
  originalHandle: string;
  cleanedTitle: string;
  newHandle: string;
}

export default function ProductNameCleanup() {
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [backup, setBackup] = useState<BackupData[] | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const loadPreview = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/products/cleanup-names');
      const data = await response.json();

      if (response.ok) {
        setPreview(data.preview);
        setShowPreview(true);
        setMessage({
          type: 'info',
          text: `Found ${data.productsToUpdate} products with multiple variants that can be cleaned up`
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load preview' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load preview' });
    } finally {
      setIsLoading(false);
    }
  };

  const executeCleanup = async () => {
    if (!confirm(`Are you sure you want to clean up ${preview.length} product names? A backup will be created so you can revert if needed.`)) {
      return;
    }

    setIsExecuting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/products/cleanup-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok) {
        setBackup(data.backup);
        setMessage({
          type: 'success',
          text: `✅ Successfully cleaned up ${data.updatedCount} product names! Backup created.`
        });
        setShowPreview(false);
        setPreview([]);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to execute cleanup' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to execute cleanup' });
    } finally {
      setIsExecuting(false);
    }
  };

  const revertChanges = async () => {
    if (!backup) return;

    if (!confirm(`Are you sure you want to revert ${backup.length} products back to their original names?`)) {
      return;
    }

    setIsReverting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/products/cleanup-names', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✅ Successfully reverted ${data.revertedCount} products to their original names!`
        });
        setBackup(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to revert changes' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to revert changes' });
    } finally {
      setIsReverting(false);
    }
  };

  const downloadBackup = () => {
    if (!backup) return;

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-names-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const uploadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        setBackup(backupData);
        setMessage({ type: 'success', text: 'Backup file loaded successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid backup file' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Name Cleanup</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Remove size information from products with multiple variants
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1">What this does:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Finds products with <strong>multiple variants</strong> (different sizes/scents)</li>
              <li>Removes size information like "8oz", "16oz" from product names</li>
              <li>Creates a backup so you can revert changes if needed</li>
              <li>Only affects products with 2+ variants</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : message.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {message.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {message.type === 'info' && <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={loadPreview}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Loading Preview...
            </>
          ) : (
            <>
              <Eye className="h-5 w-5" />
              Preview Changes
            </>
          )}
        </button>

        {showPreview && preview.length > 0 && (
          <button
            onClick={executeCleanup}
            disabled={isExecuting}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Executing...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Execute Cleanup
              </>
            )}
          </button>
        )}

        {backup && (
          <>
            <button
              onClick={revertChanges}
              disabled={isReverting}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
            >
              {isReverting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Reverting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-5 w-5" />
                  Revert Changes
                </>
              )}
            </button>

            <button
              onClick={downloadBackup}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-lg"
            >
              <Download className="h-5 w-5" />
              Download Backup
            </button>
          </>
        )}

        <label className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-lg cursor-pointer">
          <Upload className="h-5 w-5" />
          Load Backup
          <input
            type="file"
            accept=".json"
            onChange={uploadBackup}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview Table */}
      {showPreview && preview.length > 0 && (
        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Original Name</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">→</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">New Name</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Variants</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {preview.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.originalTitle}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-purple-600 dark:text-purple-400">→</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.cleanedTitle}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {item.variantCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPreview && preview.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
          <p className="text-gray-600 dark:text-gray-400">
            All product names are already clean! No changes needed.
          </p>
        </div>
      )}
    </div>
  );
}

