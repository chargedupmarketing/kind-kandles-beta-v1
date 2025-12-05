'use client';

import { useState, useEffect } from 'react';
import { PenTool, Heart, Star, Users, Calendar, User, CheckCircle, Send, Loader } from 'lucide-react';

interface StorySubmission {
  id: string;
  title: string;
  author: string;
  email: string;
  content: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  isStarred: boolean;
  category: 'candle-journey' | 'kindness-story' | 'product-review' | 'life-moment' | 'other';
  publishedAt?: Date;
  adminNotes?: string;
}

export default function WriteYourStoryPage() {
  const [approvedStories, setApprovedStories] = useState<StorySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    storyType: '',
    products: '',
    storyTitle: '',
    story: '',
    canFeature: false,
    newsletter: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load approved stories from localStorage
  useEffect(() => {
    const loadApprovedStories = () => {
      try {
        const savedStories = localStorage.getItem('storySubmissions');
        if (savedStories) {
          const allStories = JSON.parse(savedStories);
          // Convert date strings back to Date objects and filter for approved/published stories
          const stories = allStories
            .map((story: any) => ({
              ...story,
              submittedAt: new Date(story.submittedAt),
              publishedAt: story.publishedAt ? new Date(story.publishedAt) : undefined
            }))
            .filter((story: StorySubmission) => 
              story.status === 'approved' || story.status === 'published'
            )
            .sort((a: StorySubmission, b: StorySubmission) => {
              // Sort by published date if available, otherwise by submitted date
              const dateA = a.publishedAt || a.submittedAt;
              const dateB = b.publishedAt || b.submittedAt;
              return dateB.getTime() - dateA.getTime();
            });
          
          setApprovedStories(stories);
        }
      } catch (error) {
        console.error('Error loading stories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApprovedStories();

    // Listen for storage changes (when admin approves new stories)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'storySubmissions') {
        loadApprovedStories();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getCategoryLabel = (category: StorySubmission['category']) => {
    switch (category) {
      case 'candle-journey': return 'Candle Journey';
      case 'kindness-story': return 'Kindness Story';
      case 'product-review': return 'Product Review';
      case 'life-moment': return 'Life Moment';
      case 'other': return 'Other';
      default: return category;
    }
  };

  const getCategoryColor = (category: StorySubmission['category']) => {
    switch (category) {
      case 'candle-journey': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'kindness-story': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      case 'product-review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'life-moment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'other': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStoryForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.storyType) {
      newErrors.storyType = 'Please select a story type';
    }
    if (!formData.storyTitle.trim()) {
      newErrors.storyTitle = 'Story title is required';
    }
    if (!formData.story.trim()) {
      newErrors.story = 'Story content is required';
    } else if (formData.story.trim().length < 100) {
      newErrors.story = 'Story must be at least 100 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mapStoryTypeToCategory = (storyType: string): StorySubmission['category'] => {
    switch (storyType) {
      case 'love-story': return 'kindness-story';
      case 'transformation': return 'life-moment';
      case 'community': return 'kindness-story';
      default: return 'other';
    }
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStoryForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create story submission object
      const storySubmission: StorySubmission = {
        id: Date.now().toString(),
        title: formData.storyTitle,
        author: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        content: formData.story,
        submittedAt: new Date(),
        status: 'pending',
        isStarred: false,
        category: mapStoryTypeToCategory(formData.storyType),
        adminNotes: formData.products ? `Featured products: ${formData.products}` : undefined
      };

      // Get existing story submissions from localStorage
      const existingStories = localStorage.getItem('storySubmissions');
      const stories = existingStories ? JSON.parse(existingStories) : [];
      
      // Add new story to the beginning of the array
      stories.unshift(storySubmission);
      
      // Save back to localStorage
      localStorage.setItem('storySubmissions', JSON.stringify(stories));

      // Reset form and show success
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        storyType: '',
        products: '',
        storyTitle: '',
        story: '',
        canFeature: false,
        newsletter: false
      });
      setIsSubmitted(true);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (error) {
      console.error('Error submitting story:', error);
      alert('There was an error submitting your story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const storyTypes = [
    {
      icon: <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />,
      title: 'Love Stories',
      description: 'Share how our products became part of your special moments, relationships, and celebrations.',
      examples: ['Wedding favors', 'Anniversary gifts', 'Date night ambiance', 'Self-care rituals']
    },
    {
      icon: <Star className="h-8 w-8 text-amber-600 dark:text-amber-400" />,
      title: 'Transformation Tales',
      description: 'Tell us about positive changes our products brought to your daily routine or well-being.',
      examples: ['Better sleep with candles', 'Skincare improvements', 'Stress relief', 'Home atmosphere']
    },
    {
      icon: <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
      title: 'Community Connections',
      description: 'Share experiences from our events, workshops, or how you connected with others through our brand.',
      examples: ['Candle making workshops', 'Gift exchanges', 'Community events', 'Friend recommendations']
    }
  ];

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <PenTool className="h-16 w-16 text-pink-600 dark:text-pink-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Write Your Story
          </h1>
          <p className="text-xl text-gray-700 dark:text-slate-300 mb-8">
            Share how My Kind Kandles & Boutique has touched your life
          </p>
          <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
            We believe every customer has a unique story to tell. Whether it's how our candles helped you create 
            the perfect ambiance, how our skincare transformed your routine, or how our community events brought 
            joy to your life - we want to hear from you!
          </p>
        </div>
      </section>

      {/* Story Types */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">What Kind of Story Will You Share?</h2>
            <p className="text-lg text-gray-600 dark:text-slate-300">
              Every story is unique and valuable to us
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {storyTypes.map((type, index) => (
              <div key={index} className="card p-8 text-center">
                <div className="flex justify-center mb-4">
                  {type.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  {type.title}
                </h3>
                <p className="text-gray-600 dark:text-slate-300 mb-6">
                  {type.description}
                </p>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Examples:</h4>
                  <ul className="space-y-1">
                    {type.examples.map((example, exampleIndex) => (
                      <li key={exampleIndex} className="text-sm text-gray-600 dark:text-slate-300 flex items-center">
                        <span className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full mr-2 flex-shrink-0"></span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Submission Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">Share Your Story</h2>
            <p className="text-lg text-gray-600 dark:text-slate-300">
              We'd love to feature your story on our website and social media (with your permission)
            </p>
          </div>

          {/* Success Message */}
          {isSubmitted && (
            <div className="mb-8 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Story Submitted Successfully!</h3>
                  <p className="text-green-700 dark:text-green-400">
                    Thank you for sharing your story! We'll review it and may feature it on our website soon.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="card p-8">
            <form onSubmit={handleStorySubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                      errors.firstName 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-slate-600'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="storyType" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Story Type *
                </label>
                <select
                  id="storyType"
                  name="storyType"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select a story type</option>
                  <option value="love-story">Love Story</option>
                  <option value="transformation">Transformation Tale</option>
                  <option value="community">Community Connection</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="products" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Which products are featured in your story?
                </label>
                <input
                  type="text"
                  id="products"
                  name="products"
                  placeholder="e.g., Calm Down Girl Candle, Luxury Body Butter"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="storyTitle" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Story Title *
                </label>
                <input
                  type="text"
                  id="storyTitle"
                  name="storyTitle"
                  required
                  placeholder="Give your story a catchy title"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="story" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Your Story * <span className="text-gray-500 dark:text-slate-400">(minimum 100 words)</span>
                </label>
                <textarea
                  id="story"
                  name="story"
                  rows={8}
                  required
                  placeholder="Tell us your story... How did our products impact your life? What made your experience special? Be as detailed as you'd like!"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                ></textarea>
              </div>

              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="canFeature"
                    className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">
                    I give permission for My Kind Kandles & Boutique to feature my story on their website, 
                    social media, and marketing materials. I understand that my name and story may be shared publicly.
                  </span>
                </label>
              </div>

              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="newsletter"
                    className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">
                    I'd like to receive updates about new products, events, and special offers from My Kind Kandles & Boutique.
                  </span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full btn-primary flex items-center justify-center space-x-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Submitting Story...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Your Story</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">Featured Customer Stories</h2>
            <p className="text-lg text-gray-600 dark:text-slate-300">
              Read how our products have touched the lives of our amazing customers
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          ) : approvedStories.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-slate-400 mb-2">No Stories Yet</h3>
              <p className="text-gray-500 dark:text-slate-500">
                Be the first to share your story with Kind Kandles Boutique!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {approvedStories.map((story) => (
                <div key={story.id} className="card p-6 hover:shadow-lg transition-shadow duration-300">
                  {/* Story Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(story.category)}`}>
                          {getCategoryLabel(story.category)}
                        </span>
                        {story.isStarred && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2 line-clamp-2">
                        {story.title}
                      </h3>
                    </div>
                  </div>

                  {/* Story Content */}
                  <div className="mb-4">
                    <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed italic">
                      "{truncateContent(story.content, 180)}"
                    </p>
                  </div>

                  {/* Story Footer */}
                  <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {story.author}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {(story.publishedAt || story.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Star Rating Display */}
                  <div className="flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-slate-400 ml-2">Verified Customer</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show More Button */}
          {approvedStories.length > 6 && (
            <div className="text-center mt-8">
              <button className="btn-secondary">
                View All Stories
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 gradient-bg dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Every Story Matters
          </h2>
          <p className="text-lg text-gray-700 dark:text-slate-300 mb-8">
            Your experience with our products is unique and valuable. By sharing your story, 
            you help us improve and inspire others to discover the kindness in natural, handmade products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#story-form" className="btn-primary">
              Share Your Story Now
            </a>
            <a href="/collections" className="btn-secondary">
              Shop Our Products
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
