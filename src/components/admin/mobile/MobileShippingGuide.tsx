'use client';

import { Download, Upload, Package, Truck, CheckCircle, AlertCircle, ExternalLink, ArrowLeft } from 'lucide-react';

interface MobileShippingGuideProps {
  onBack: () => void;
}

export default function MobileShippingGuide({ onBack }: MobileShippingGuideProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center space-x-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Shipping Guide</h1>
              <p className="text-xs text-purple-100">Pirate Ship Workflow</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Overview */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Package className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">How It Works</h2>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Pirate Ship doesn't have a public API, so we use a <strong>manual CSV workflow</strong>. 
              Export orders → Create labels in Pirate Ship → Import tracking numbers back.
            </p>
          </div>
        </section>

        {/* Step 1 */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center justify-center w-7 h-7 bg-purple-600 text-white rounded-full font-bold text-sm">
              1
            </div>
            <h2 className="text-lg font-bold text-gray-900">Export Orders</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Download className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Go to <strong>Orders</strong> tab</li>
                  <li>Tap the menu (⋮) in the top right</li>
                  <li>Select <strong>"Export to CSV"</strong></li>
                  <li>CSV downloads with all pending orders</li>
                </ol>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                The CSV includes customer name, address, order number, weight, and notes - formatted for Pirate Ship.
              </p>
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full font-bold text-sm">
              2
            </div>
            <h2 className="text-lg font-bold text-gray-900">Create Labels</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Truck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">In Pirate Ship:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Log in to <a href="https://www.pirateship.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">pirateship.com</a></li>
                  <li>Go to <strong>Ship → Import Spreadsheet</strong></li>
                  <li>Upload your CSV file</li>
                  <li>Verify addresses</li>
                  <li>Select shipping methods</li>
                  <li>Purchase labels</li>
                  <li>Export results with tracking numbers</li>
                </ol>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> Pirate Ship offers the cheapest USPS/UPS rates with no monthly fees!
              </p>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white rounded-full font-bold text-sm">
              3
            </div>
            <h2 className="text-lg font-bold text-gray-900">Import Tracking</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Upload className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Export CSV from Pirate Ship (with tracking)</li>
                  <li>Return to <strong>Orders</strong> tab</li>
                  <li>Tap menu (⋮) → <strong>"Import Tracking"</strong></li>
                  <li>Select the Pirate Ship CSV</li>
                  <li>Tracking numbers auto-match to orders</li>
                  <li>Orders update to "shipped" status</li>
                </ol>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-800">
                Customers can now track their orders!
              </p>
            </div>
          </div>
        </section>

        {/* CSV Format */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">CSV Format</h2>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Export (to Pirate Ship):</h3>
              <div className="bg-gray-100 rounded-lg p-3">
                <code className="text-xs text-gray-700 block">
                  Name, Address, City, State, Zip, Email, Phone, Order #, Weight, Notes
                </code>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Import (from Pirate Ship):</h3>
              <div className="bg-gray-100 rounded-lg p-3">
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>• <strong>Order Number</strong> (must match)</li>
                  <li>• <strong>Tracking Number</strong></li>
                  <li>• <strong>Tracking URL</strong> (optional)</li>
                  <li>• <strong>Carrier</strong> (optional)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Best Practices</h2>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4">
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700"><strong>Process daily</strong> for fast shipping</p>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700"><strong>Verify addresses</strong> in Pirate Ship</p>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700"><strong>Keep CSV files</strong> organized by date</p>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700"><strong>Import tracking promptly</strong> for customer notifications</p>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700"><strong>Check order weights</strong> for accurate costs</p>
              </li>
            </ul>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">Troubleshooting</h2>
          </div>
          <div className="bg-red-50 rounded-lg p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">CSV won't upload:</h3>
              <p className="text-xs text-gray-700">Check for special characters in addresses</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Import fails:</h3>
              <p className="text-xs text-gray-700">Verify order numbers match exactly</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Address errors:</h3>
              <p className="text-xs text-gray-700">Use Pirate Ship's suggestions or contact customer</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Missing tracking:</h3>
              <p className="text-xs text-gray-700">Export results CSV from Pirate Ship after purchasing labels</p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Quick Links</h2>
          </div>
          <div className="space-y-2">
            <a
              href="https://www.pirateship.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg active:bg-blue-100"
            >
              <span className="font-medium text-blue-900 text-sm">Pirate Ship Login</span>
              <ExternalLink className="h-4 w-4 text-blue-600" />
            </a>
            <a
              href="https://www.pirateship.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg active:bg-blue-100"
            >
              <span className="font-medium text-blue-900 text-sm">Pirate Ship Support</span>
              <ExternalLink className="h-4 w-4 text-blue-600" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

