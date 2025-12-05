'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: "Do you offer custom candle making?",
      answer: "Yes! We offer custom candle making services and mobile candle making experiences for events. Contact us to discuss your specific needs and we'll create something special for you."
    },
    {
      question: "What ingredients do you use in your products?",
      answer: "We use only natural, high-quality ingredients including soy wax, essential oils, natural butters, and organic botanicals. All our products are handmade with care and attention to detail."
    },
    {
      question: "Do you ship nationwide?",
      answer: "Yes, we ship our products nationwide. Shipping costs and delivery times vary by location. Contact us for specific shipping information to your area."
    },
    {
      question: "How long do your candles burn?",
      answer: "Our candle burn times vary by size. Small candles (4oz) burn for approximately 25-30 hours, medium candles (8oz) burn for 50-60 hours, and large candles (12oz) burn for 75-85 hours with proper care."
    },
    {
      question: "Are your products vegan and cruelty-free?",
      answer: "Yes! All of our products are 100% vegan and cruelty-free. We never test on animals and use only plant-based ingredients in our formulations."
    },
    {
      question: "What is your return policy?",
      answer: "We have a 30-day return policy for unused items in their original packaging. Custom and personalized items cannot be returned unless defective. Please see our full refund policy for complete details."
    },
    {
      question: "How should I care for my candles?",
      answer: "For best results, trim the wick to 1/4 inch before each use, burn for no more than 4 hours at a time, and keep away from drafts. This ensures even burning and maximum fragrance throw."
    },
    {
      question: "Do you offer wholesale pricing?",
      answer: "Yes, we offer wholesale pricing for retailers and bulk orders. Please contact us directly to discuss wholesale opportunities and minimum order requirements."
    },
    {
      question: "Can I schedule a mobile candle making party?",
      answer: "Absolutely! Our mobile candle making experiences are perfect for birthdays, bachelorette parties, corporate events, and more. We bring all supplies and guide your group through creating their own custom candles."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Find answers to common questions about our products, services, and policies
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </h3>
                  {openItems.includes(index) ? (
                    <ChevronUp className="h-5 w-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                  )}
                </button>
                {openItems.includes(index) && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Still Have Questions?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Can't find what you're looking for? We're here to help! Reach out to us directly.
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
