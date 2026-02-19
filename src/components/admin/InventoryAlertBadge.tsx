'use client';

import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Package, ChevronDown, ChevronUp } from 'lucide-react';

export interface InventoryAlert {
  product_id: string;
  variant_id?: string;
  product_title: string;
  variant_title?: string;
  current_stock: number;
  ordered_quantity: number;
  status: 'critical' | 'low' | 'ok';
}

interface InventoryAlertBadgeProps {
  alerts: InventoryAlert[];
  compact?: boolean;
  showDetails?: boolean;
}

export default function InventoryAlertBadge({ 
  alerts, 
  compact = false,
  showDetails = true 
}: InventoryAlertBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const criticalCount = alerts.filter(a => a.status === 'critical').length;
  const lowCount = alerts.filter(a => a.status === 'low').length;
  const hasIssues = criticalCount > 0 || lowCount > 0;

  if (!hasIssues) {
    if (compact) return null;
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" />
        Stock OK
      </span>
    );
  }

  // Compact mode - just show badge
  if (compact) {
    if (criticalCount > 0) {
      return (
        <span 
          className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full"
          title={`${criticalCount} item(s) out of stock`}
        >
          <AlertCircle className="w-3 h-3" />
          {criticalCount}
        </span>
      );
    }
    return (
      <span 
        className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"
        title={`${lowCount} item(s) low stock`}
      >
        <AlertTriangle className="w-3 h-3" />
        {lowCount}
      </span>
    );
  }

  // Full mode with expandable details
  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg transition-colors ${
          criticalCount > 0 
            ? 'text-red-700 bg-red-100 hover:bg-red-200' 
            : 'text-amber-700 bg-amber-100 hover:bg-amber-200'
        }`}
      >
        {criticalCount > 0 ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5" />
        )}
        <span>
          {criticalCount > 0 && `${criticalCount} out of stock`}
          {criticalCount > 0 && lowCount > 0 && ', '}
          {lowCount > 0 && `${lowCount} low stock`}
        </span>
        {showDetails && (
          expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {showDetails && expanded && (
        <div className="bg-gray-50 rounded-lg p-2 space-y-1.5 text-xs">
          {alerts
            .filter(a => a.status !== 'ok')
            .map((alert, index) => (
              <div 
                key={`${alert.product_id}-${alert.variant_id || index}`}
                className={`flex items-start gap-2 p-1.5 rounded ${
                  alert.status === 'critical' ? 'bg-red-50' : 'bg-amber-50'
                }`}
              >
                <Package className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                  alert.status === 'critical' ? 'text-red-600' : 'text-amber-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {alert.product_title}
                    {alert.variant_title && (
                      <span className="text-gray-500"> - {alert.variant_title}</span>
                    )}
                  </p>
                  <p className={alert.status === 'critical' ? 'text-red-700' : 'text-amber-700'}>
                    {alert.status === 'critical' ? (
                      <>
                        Need {alert.ordered_quantity}, only {alert.current_stock} in stock
                      </>
                    ) : (
                      <>
                        Low stock: {alert.current_stock} remaining
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// Utility component for inline inventory status
export function InventoryStatusDot({ status }: { status: 'critical' | 'low' | 'ok' }) {
  if (status === 'critical') {
    return (
      <span className="w-2 h-2 rounded-full bg-red-500" title="Out of stock" />
    );
  }
  if (status === 'low') {
    return (
      <span className="w-2 h-2 rounded-full bg-amber-500" title="Low stock" />
    );
  }
  return (
    <span className="w-2 h-2 rounded-full bg-green-500" title="In stock" />
  );
}

// Summary component for multiple orders
export function InventorySummaryBadge({ 
  summary 
}: { 
  summary: { critical: number; low: number; ok: number } 
}) {
  const { critical, low } = summary;
  
  if (critical === 0 && low === 0) {
    return (
      <span className="text-xs text-green-700">
        All items in stock
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {critical > 0 && (
        <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3" />
          {critical} critical
        </span>
      )}
      {low > 0 && (
        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          {low} low
        </span>
      )}
    </div>
  );
}
