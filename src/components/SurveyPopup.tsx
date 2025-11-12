'use client';

import { useState, useEffect } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';

interface SurveyData {
  email: string;
  name: string;
  gender: string;
  ageRange: string;
  location: string;
  howDidYouFindUs: string;
  candlePreferences: string[];
  otherInfo?: string;
}

export default function SurveyPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState<SurveyData>({
    email: '',
    name: '',
    gender: '',
    ageRange: '',
    location: '',
    howDidYouFindUs: '',
    candlePreferences: [],
    otherInfo: ''
  });

  // Ensure component is mounted before accessing localStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem('hasSeenSurvey');
    
    if (!hasSeenPopup) {
      // Show popup after 3 seconds on first visit
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isMounted]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenSurvey', 'true');
  };

  const handleInputChange = (field: keyof SurveyData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCandlePreferenceToggle = (preference: string) => {
    setFormData(prev => {
      const preferences = prev.candlePreferences.includes(preference)
        ? prev.candlePreferences.filter(p => p !== preference)
        : [...prev.candlePreferences, preference];
      return { ...prev, candlePreferences: preferences };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setCouponCode(data.couponCode);
        setStep(3); // Show success step with coupon
        localStorage.setItem('hasSeenSurvey', 'true');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('There was an error submitting your survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const candleTypes = [
    'Floral',
    'Citrus',
    'Woodsy',
    'Fresh',
    'Sweet',
    'Herbal',
    'Earthy'
  ];

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-2xl shadow-pink-500/30 border border-pink-500/40">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
          style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Step 1: Welcome & Basic Info */}
        {step === 1 && (
          <div className="p-4 sm:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full mb-2 sm:mb-4 border border-pink-500/50">
                <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400" />
              </div>
              <h2 className="serif-font text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.3)' }}>
                Welcome to My Kind Kandles! 🕯️
              </h2>
              <p className="text-sm sm:text-lg text-gray-200" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>
                Get <span className="font-bold text-pink-400" style={{ textShadow: '0 0 15px rgba(236, 72, 153, 0.5)' }}>20% OFF</span> your first order by completing our quick survey!
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-pink-500/30 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-pink-500/30 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
                  placeholder="your@email.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                    Gender *
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-pink-500/30 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white backdrop-blur-sm text-sm sm:text-base"
                  >
                    <option value="" className="bg-gray-800">Select...</option>
                    <option value="female" className="bg-gray-800">Female</option>
                    <option value="male" className="bg-gray-800">Male</option>
                    <option value="non-binary" className="bg-gray-800">Non-binary</option>
                    <option value="prefer-not-to-say" className="bg-gray-800">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                    Age Range *
                  </label>
                  <select
                    required
                    value={formData.ageRange}
                    onChange={(e) => handleInputChange('ageRange', e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-pink-500/30 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white backdrop-blur-sm text-sm sm:text-base"
                  >
                    <option value="" className="bg-gray-800">Select...</option>
                    <option value="18-24" className="bg-gray-800">18-24</option>
                    <option value="25-34" className="bg-gray-800">25-34</option>
                    <option value="35-44" className="bg-gray-800">35-44</option>
                    <option value="45-54" className="bg-gray-800">45-54</option>
                    <option value="55-64" className="bg-gray-800">55-64</option>
                    <option value="65+" className="bg-gray-800">65+</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 sm:py-4 text-base sm:text-lg flex items-center justify-center gap-2"
              >
                Continue
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </form>

            <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-3 sm:mt-4" style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.2)' }}>
              We respect your privacy. Your information will never be shared.
            </p>
          </div>
        )}

        {/* Step 2: Preferences & Survey Questions */}
        {step === 2 && (
          <div className="p-4 sm:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="serif-font text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.3)' }}>
                Tell Us About Your Preferences ✨
              </h2>
              <p className="text-sm sm:text-base text-gray-200" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>
                Just a few more questions to unlock your discount!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                  Where are you located? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-pink-500/30 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
                  placeholder="City, State or Country"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                  How did you find us? *
                </label>
                <select
                  required
                  value={formData.howDidYouFindUs}
                  onChange={(e) => handleInputChange('howDidYouFindUs', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-pink-500/30 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white backdrop-blur-sm text-sm sm:text-base"
                >
                  <option value="" className="bg-gray-800">Select...</option>
                  <option value="social-media" className="bg-gray-800">Social Media</option>
                  <option value="google-search" className="bg-gray-800">Google Search</option>
                  <option value="friend-referral" className="bg-gray-800">Friend/Family Referral</option>
                  <option value="instagram" className="bg-gray-800">Instagram</option>
                  <option value="facebook" className="bg-gray-800">Facebook</option>
                  <option value="tiktok" className="bg-gray-800">TikTok</option>
                  <option value="craft-fair" className="bg-gray-800">Craft Fair/Market</option>
                  <option value="other" className="bg-gray-800">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-white mb-2 sm:mb-3" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                  What candle scents do you enjoy? (Select all that apply) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {candleTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleCandlePreferenceToggle(type)}
                      className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-2 transition-all duration-200 text-sm sm:text-base ${
                        formData.candlePreferences.includes(type)
                          ? 'border-pink-500 bg-pink-500/30 text-white font-semibold backdrop-blur-sm'
                          : 'border-pink-500/30 bg-white/5 text-gray-200 hover:border-pink-500/50 hover:bg-white/10'
                      }`}
                      style={formData.candlePreferences.includes(type) ? { textShadow: '0 0 10px rgba(236, 72, 153, 0.5)' } : {}}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-white mb-1 sm:mb-2" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>
                  Anything else you'd like to share? (Optional)
                </label>
                <textarea
                  value={formData.otherInfo}
                  onChange={(e) => handleInputChange('otherInfo', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/10 border border-pink-500/30 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-white placeholder-gray-400 backdrop-blur-sm text-sm sm:text-base"
                  rows={2}
                  placeholder="Tell us what you're looking for..."
                />
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 sm:px-6 sm:py-4 border-2 border-pink-500/30 text-white rounded-lg hover:bg-white/10 transition-colors font-medium backdrop-blur-sm text-sm sm:text-base"
                  style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.candlePreferences.length === 0}
                  className="flex-1 btn-primary py-3 sm:py-4 text-base sm:text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Get My Coupon'}
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success & Coupon */}
        {step === 3 && (
          <div className="p-4 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500/30 to-teal-500/30 rounded-full mb-4 sm:mb-6 animate-bounce border border-green-500/50">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-green-400" />
            </div>

            <h2 className="serif-font text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.4)' }}>
              Thank You, {formData.name}! 🎉
            </h2>
            
            <p className="text-sm sm:text-lg text-gray-200 mb-4 sm:mb-6" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>
              Here's your exclusive 20% discount code:
            </p>

            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-2 border-pink-500/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-sm">
              <p className="text-xs sm:text-sm text-gray-300 mb-2" style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.2)' }}>Your Coupon Code</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                <code className="serif-font text-2xl sm:text-3xl font-bold text-pink-400" style={{ textShadow: '0 0 20px rgba(236, 72, 153, 0.6)' }}>
                  {couponCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(couponCode);
                    alert('Coupon code copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-xs sm:text-sm font-medium shadow-lg shadow-pink-500/30"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3" style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.2)' }}>
                Valid for your first purchase • One-time use only
              </p>
            </div>

            <p className="text-sm sm:text-base text-gray-200 mb-4 sm:mb-6" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }}>
              We've sent this code to <strong className="text-white">{formData.email}</strong>
            </p>

            <button
              onClick={handleClose}
              className="btn-primary px-6 py-2.5 sm:px-8 sm:py-3 text-base sm:text-lg shadow-lg shadow-pink-500/30"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

