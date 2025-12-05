export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="gradient-bg py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Refund Policy
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            We have a 30-day return policy to ensure your satisfaction with our handmade products.
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <div className="bg-pink-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">30-Day Return Policy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We have a 30-day return policy, which means you have 30 days after receiving your item to request a return.
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Return Eligibility</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You'll also need the receipt or proof of purchase.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Contact us:</strong> To start a return, contact us at <a href="mailto:k@kindkandlesboutique.com" className="text-pink-600 hover:text-pink-700">k@kindkandlesboutique.com</a>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Damages and Issues</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Exceptions / Non-Returnable Items</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases. Please get in touch if you have questions or concerns about your specific item.
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Note:</strong> Unfortunately, we cannot accept returns on sale items or gift cards.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How to Return Items</h3>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>
                    To start a return, you can contact us at <a href="mailto:k@kindkandlesboutique.com" className="text-pink-600 hover:text-pink-700">k@kindkandlesboutique.com</a>. Please note that returns will need to be sent to the following address: [INSERT RETURN ADDRESS]
                  </p>
                  <p>
                    If your return is accepted, we'll send you a return shipping label, as well as instructions on how and where to send your package. Items sent back to us without first requesting a return will not be accepted.
                  </p>
                  <p>
                    You can always contact us for any return question at <a href="mailto:k@kindkandlesboutique.com" className="text-pink-600 hover:text-pink-700">k@kindkandlesboutique.com</a>.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Refunds</h3>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>
                    We will notify you once we've received and inspected your return, and let you know if the refund was approved or not. If approved, you'll be automatically refunded on your original payment method within 10 business days. Please remember it can take some time for your bank or credit card company to process and post the refund too.
                  </p>
                  <p>
                    If more than 15 business days have passed since we've approved your return, please contact us at <a href="mailto:k@kindkandlesboutique.com" className="text-pink-600 hover:text-pink-700">k@kindkandlesboutique.com</a>.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Exchanges</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">European Union 14 Day Cooling Off Period</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Notwithstanding the above, if the merchandise is being shipped into the European Union, you have the right to cancel or return your order within 14 days, for any reason and without a justification. As above, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You'll also need the receipt or proof of purchase.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="bg-pink-50 dark:bg-gray-800 rounded-lg p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>Address:</strong><br />
                    9505 Reisterstown Rd<br />
                    Suite 2SE<br />
                    Owings Mills Maryland 21117
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Email:</strong> <a href="mailto:k@kindkandlesboutique.com" className="text-pink-600 hover:text-pink-700">k@kindkandlesboutique.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Questions About Returns?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Contact us at k@kindkandlesboutique.com for any questions about returns, exchanges, or refunds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/about/contact" className="btn-primary">
              Contact Us
            </a>
            <a href="mailto:k@kindkandlesboutique.com" className="btn-secondary">
              Email Us Directly
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
