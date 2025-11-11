import { Palette, Gift, Users, Clock } from 'lucide-react';

export default function CustomsPage() {
  const customServices = [
    {
      icon: <Palette className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
      title: 'Custom Candles',
      description: 'Create your perfect candle with custom scents, colors, and containers',
      features: ['Choose your scent blend', 'Select container style', 'Custom labels available', 'Minimum order: 6 candles'],
      price: 'Starting at $30 per candle'
    },
    {
      icon: <Gift className="h-8 w-8 text-pink-600 dark:text-pink-400" />,
      title: 'Gift Sets',
      description: 'Curated gift sets for special occasions and corporate gifts',
      features: ['Personalized packaging', 'Custom product selection', 'Branded options available', 'Bulk pricing available'],
      price: 'Starting at $50 per set'
    },
    {
      icon: <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
      title: 'Event Experiences',
      description: 'Mobile candle making workshops for parties and corporate events',
      features: ['On-site candle making', 'All supplies included', 'Professional instruction', 'Take-home candles'],
      price: 'Starting at $35 per person'
    },
    {
      icon: <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />,
      title: 'Subscription Boxes',
      description: 'Monthly curated boxes of our latest products',
      features: ['New products each month', 'Exclusive items', 'Flexible scheduling', 'Perfect for gifts'],
      price: 'Starting at $25 per month'
    }
  ];

  const process = [
    {
      step: '1',
      title: 'Consultation',
      description: 'We discuss your vision, preferences, and requirements'
    },
    {
      step: '2',
      title: 'Design',
      description: 'We create a custom proposal with scents, colors, and packaging'
    },
    {
      step: '3',
      title: 'Sample',
      description: 'We provide samples for your approval before full production'
    },
    {
      step: '4',
      title: 'Creation',
      description: 'We handcraft your custom products with care and attention'
    },
    {
      step: '5',
      title: 'Delivery',
      description: 'Your custom order is carefully packaged and delivered'
    }
  ];

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Hero Section */}
      <section className="gradient-bg dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            My Kind Customs
          </h1>
          <p className="text-xl text-gray-700 dark:text-slate-300 mb-8">
            Create something uniquely yours with our custom products and experiences
          </p>
          <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
            From personalized candles to mobile candle-making experiences, we'll work with you to create 
            something special that reflects your style, celebrates your occasion, or builds your brand.
          </p>
        </div>
      </section>

      {/* Custom Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">Custom Services</h2>
            <p className="text-lg text-gray-600 dark:text-slate-300">
              Choose from our range of customization options
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {customServices.map((service, index) => (
              <div key={index} className="card p-8">
                <div className="flex items-center mb-4">
                  {service.icon}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 ml-3">
                    {service.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-slate-300 mb-4">
                  {service.description}
                </p>
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600 dark:text-slate-300">
                      <div className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-4">
                  {service.price}
                </p>
                <button className="w-full btn-primary">
                  Request Quote
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">Our Custom Process</h2>
            <p className="text-lg text-gray-600 dark:text-slate-300">
              How we bring your custom vision to life
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Options */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 gradient-amber-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">Endless Possibilities</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Scent Customization</h3>
                  <p className="text-gray-600 dark:text-slate-300">
                    Choose from over 50 premium fragrances or work with us to create a completely unique scent blend. 
                    We can match existing fragrances or develop something entirely new.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Visual Design</h3>
                  <p className="text-gray-600 dark:text-slate-300">
                    Select from various container styles, colors, and sizes. Add custom labels with your logo, 
                    personal message, or special design elements.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Packaging Options</h3>
                  <p className="text-gray-600 dark:text-slate-300">
                    From elegant gift boxes to branded packaging for corporate gifts, we offer various packaging 
                    solutions to make your custom products presentation-ready.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-200 dark:bg-slate-700 aspect-square rounded-lg flex items-center justify-center">
              <span className="text-gray-400 dark:text-slate-400">Custom Products Gallery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-pink-50 dark:bg-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-6">
              <p className="text-gray-600 dark:text-slate-300 mb-4 italic">
                "The custom candles for our wedding were absolutely perfect! The scent was exactly what we envisioned, 
                and the personalized labels made them such special favors for our guests."
              </p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">- Sarah & Michael</p>
            </div>
            <div className="card p-6">
              <p className="text-gray-600 dark:text-slate-300 mb-4 italic">
                "We hired My Kind Kandles for our corporate team building event. The mobile candle making experience 
                was fantastic - everyone had so much fun and loved taking home their custom creations!"
              </p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">- Jennifer, HR Director</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 gradient-teal-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Ready to Create Something Special?
          </h2>
          <p className="text-lg text-gray-600 dark:text-slate-300 mb-8">
            Let's discuss your custom project and bring your vision to life. 
            Contact us today for a free consultation and quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/about/contact" className="btn-primary">
              Start Your Custom Order
            </a>
            <a href="tel:555-123-4567" className="btn-secondary">
              Call Us: (555) 123-4567
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
