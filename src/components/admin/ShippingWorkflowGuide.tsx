'use client';

import { X, Download, Upload, Package, Truck, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ShippingWorkflowGuideProps {
  onClose: () => void;
}

export default function ShippingWorkflowGuide({ onClose }: ShippingWorkflowGuideProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pirate Ship Workflow Guide</h2>
              <p className="text-purple-100 text-sm mt-1">Complete shipping integration workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Overview */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-5 w-5 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Overview</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">
                Since Pirate Ship doesn't offer a public API, we use a <strong>manual CSV workflow</strong> to integrate 
                shipping. This process involves exporting orders from your admin panel, uploading them to Pirate Ship 
                to create labels, and then importing tracking numbers back into your system.
              </p>
            </div>
          </section>

          {/* Step 1: Export Orders */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900">Export Orders to CSV</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex items-start space-x-3">
                <Download className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">How to Export:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Go to the <strong>Orders</strong> section in your admin panel</li>
                    <li>Click the <strong>"Export CSV"</strong> button (purple button with download icon)</li>
                    <li>A CSV file will download with all pending/processing orders</li>
                    <li>The file includes: customer name, address, order number, weight, and notes</li>
                  </ol>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <strong>Important:</strong> The CSV is formatted specifically for Pirate Ship with all required columns 
                  (Name, Address, City, State, Zip, Order Number, Weight, etc.)
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Upload to Pirate Ship */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900">Upload to Pirate Ship</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex items-start space-x-3">
                <Truck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">In Pirate Ship:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Log in to your <a href="https://www.pirateship.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">Pirate Ship account <ExternalLink className="h-3 w-3 ml-1" /></a></li>
                    <li>Navigate to <strong>Ship → Import Spreadsheet</strong></li>
                    <li>Upload the CSV file you exported from your admin panel</li>
                    <li>Pirate Ship will validate addresses and show you shipping rate options</li>
                    <li>Select your preferred shipping method for each order (USPS, UPS, etc.)</li>
                    <li>Purchase shipping labels in bulk</li>
                    <li>Export the results with tracking numbers from Pirate Ship</li>
                  </ol>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Pirate Ship offers the cheapest USPS and UPS rates with no monthly fees. 
                  They automatically validate addresses and suggest corrections if needed.
                </p>
              </div>
            </div>
          </section>

          {/* Step 3: Import Tracking Numbers */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900">Import Tracking Numbers</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex items-start space-x-3">
                <Upload className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">How to Import:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>After creating labels in Pirate Ship, export their CSV with tracking numbers</li>
                    <li>Return to your admin panel <strong>Orders</strong> section</li>
                    <li>Click the <strong>"Import Tracking"</strong> button (teal button with upload icon)</li>
                    <li>Select the CSV file exported from Pirate Ship</li>
                    <li>The system will automatically match orders by order number</li>
                    <li>Tracking numbers and URLs will be added to your orders</li>
                    <li>Order status will automatically update to "shipped"</li>
                  </ol>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <strong>Success:</strong> Once imported, customers can track their orders, and you can view 
                  tracking information in the order details.
                </div>
              </div>
            </div>
          </section>

          {/* CSV Format Reference */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">CSV Format Reference</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <h4 className="font-semibold text-gray-900">Export CSV Columns (to Pirate Ship):</h4>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <code className="text-xs text-gray-700 block whitespace-pre-wrap">
                  Name, Company, Address 1, Address 2, City, State, Zip, Country, Email, Phone, Order Number, Weight (oz), Notes
                </code>
              </div>
              
              <h4 className="font-semibold text-gray-900 mt-4">Import CSV Requirements (from Pirate Ship):</h4>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li><strong>Order Number</strong> - Must match your original order numbers</li>
                  <li><strong>Tracking Number</strong> - The tracking number from the carrier</li>
                  <li><strong>Tracking URL</strong> (optional) - Direct link to track the package</li>
                  <li><strong>Carrier</strong> (optional) - USPS, UPS, etc.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Best Practices</h3>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5">
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Process orders daily</strong> to ensure fast shipping times</p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Verify addresses</strong> in Pirate Ship before purchasing labels</p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Keep CSV files organized</strong> by date for record-keeping</p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Import tracking numbers promptly</strong> so customers receive notifications</p>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Double-check order weights</strong> to ensure accurate shipping costs</p>
                </li>
              </ul>
            </div>
          </section>

          {/* Troubleshooting */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Troubleshooting</h3>
            </div>
            <div className="bg-red-50 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">CSV won't upload to Pirate Ship:</h4>
                <p className="text-sm text-gray-700">Ensure all required fields are filled. Check for special characters in addresses.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tracking import fails:</h4>
                <p className="text-sm text-gray-700">Verify that order numbers in the CSV exactly match your system's order numbers.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Address validation errors:</h4>
                <p className="text-sm text-gray-700">Use Pirate Ship's address suggestions. Contact customer if address is invalid.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Missing tracking numbers:</h4>
                <p className="text-sm text-gray-700">Ensure you exported the results CSV from Pirate Ship after purchasing labels.</p>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Quick Links</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a
                href="https://www.pirateship.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="font-medium text-blue-900">Pirate Ship Login</span>
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </a>
              <a
                href="https://www.pirateship.com/support"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="font-medium text-blue-900">Pirate Ship Support</span>
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}

