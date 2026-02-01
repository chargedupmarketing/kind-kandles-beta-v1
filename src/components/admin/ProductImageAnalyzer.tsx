'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Brain,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Loader,
  Eye,
  Search,
  Plus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react';
import Image from 'next/image';

interface ExtractedInfo {
  productName: string;
  scentName: string;
  productType: string;
  visualFeatures: {
    colors: string[];
    containerType: string;
    size: string;
  };
}

interface ProductMatch {
  productId: string;
  productTitle: string;
  productHandle: string;
  confidence: number;
  matchReasons: string[];
}

interface ImageAnalysis {
  imageId: string;
  imageUrl: string;
  extractedInfo: ExtractedInfo;
  matches: ProductMatch[];
  autoAssignRecommended: boolean;
  status?: 'pending' | 'analyzing' | 'complete' | 'error';
  error?: string;
  selectedProductId?: string;
  assigned?: boolean;
}

interface RecentlyCreatedProduct {
  id: string;
  title: string;
  handle: string;
  createdAt: number;
  imageCount: number;
}

interface CreateProductFormData {
  title: string;
  productType: string;
  price: string;
  description: string;
}

// Product type presets with default prices
const PRODUCT_TYPE_PRESETS = [
  { value: 'Candle', label: 'Candle', defaultPrice: 25 },
  { value: 'Body Butter', label: 'Body Butter', defaultPrice: 18 },
  { value: 'Body Oil', label: 'Body Oil', defaultPrice: 15 },
  { value: 'Hair Oil', label: 'Hair Oil', defaultPrice: 16 },
  { value: 'Room Spray', label: 'Room Spray', defaultPrice: 12 },
  { value: 'Bar Soap', label: 'Bar Soap', defaultPrice: 8 },
  { value: 'Lotion', label: 'Lotion', defaultPrice: 14 },
  { value: 'Body Scrub', label: 'Body Scrub', defaultPrice: 16 },
];

export default function ProductImageAnalyzer() {
  const [images, setImages] = useState<File[]>([]);
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [recentlyCreatedProducts, setRecentlyCreatedProducts] = useState<RecentlyCreatedProduct[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateProductFormData>({
    title: '',
    productType: 'Candle',
    price: '25',
    description: '',
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showRecentlyCreated, setShowRecentlyCreated] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session persistence for recently created products
  useEffect(() => {
    const saved = sessionStorage.getItem('recentlyCreatedProducts');
    if (saved) {
      try {
        setRecentlyCreatedProducts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recently created products:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (recentlyCreatedProducts.length > 0) {
      sessionStorage.setItem('recentlyCreatedProducts', JSON.stringify(recentlyCreatedProducts));
    } else {
      sessionStorage.removeItem('recentlyCreatedProducts');
    }
  }, [recentlyCreatedProducts]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length + images.length > 10) {
      alert('Maximum 10 images per batch');
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeImages = async () => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    setApiKeyMissing(false);

    try {
      // Step 1: Upload images to get URLs (one at a time to avoid payload size issues)
      const uploadedImages: { file: File; url: string }[] = [];
      
      for (const image of images) {
        try {
          const formData = new FormData();
          formData.append('file', image);

          const uploadResponse = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadResponse.json();

          if (!uploadResponse.ok) {
            console.error(`Failed to upload ${image.name}:`, uploadData.error);
            continue; // Skip this image
          }

          uploadedImages.push({
            file: image,
            url: uploadData.url,
          });
        } catch (uploadError) {
          console.error(`Error uploading ${image.name}:`, uploadError);
          continue; // Skip this image
        }
      }

      if (uploadedImages.length === 0) {
        throw new Error('Failed to upload any images. Please try again.');
      }

      // Step 2: Send image URLs to AI analyzer
      const response = await fetch('/api/admin/ai/analyze-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: uploadedImages.map(img => img.url),
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('API key')) {
          setApiKeyMissing(true);
        }
        throw new Error(data.error || 'Failed to analyze images');
      }

      console.log('Analysis results:', data.analyses);
      setAnalyses(data.analyses || []);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error('Error analyzing images:', error);
      alert(error instanceof Error ? error.message : 'Failed to analyze images');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
  };

  const advanceToNextImage = () => {
    if (currentImageIndex < analyses.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      showToast('success', 'All images processed!');
    }
  };

  const assignImageToProduct = async (analysis: ImageAnalysis, productId: string, productTitle?: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: analysis.imageUrl,
          altText: analysis.extractedInfo.productName || 'Product image',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign image');
      }

      // Update analysis status
      setAnalyses(prev =>
        prev.map(a =>
          a.imageId === analysis.imageId
            ? { ...a, assigned: true, selectedProductId: productId }
            : a
        )
      );

      // Update image count for recently created products
      setRecentlyCreatedProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, imageCount: p.imageCount + 1 }
            : p
        )
      );

      showToast('success', `Image assigned to ${productTitle || 'product'}`);
      advanceToNextImage();
    } catch (error) {
      console.error('Error assigning image:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to assign image');
    }
  };

  const openCreateModal = () => {
    const currentAnalysis = analyses[currentImageIndex];
    if (currentAnalysis) {
      const extractedInfo = currentAnalysis.extractedInfo;
      const detectedType = extractedInfo.productType || 'Candle';
      const preset = PRODUCT_TYPE_PRESETS.find(p => p.value === detectedType) || PRODUCT_TYPE_PRESETS[0];
      
      setCreateFormData({
        title: extractedInfo.productName || '',
        productType: preset.value,
        price: preset.defaultPrice.toString(),
        description: extractedInfo.scentName ? `Scent: ${extractedInfo.scentName}` : '',
      });
    }
    setShowCreateModal(true);
  };

  const createProductInquiry = async () => {
    const currentAnalysis = analyses[currentImageIndex];
    if (!currentAnalysis) return;

    setIsCreatingProduct(true);
    try {
      const response = await fetch('/api/admin/product-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiProductName: currentAnalysis.extractedInfo.productName,
          aiScentName: currentAnalysis.extractedInfo.scentName,
          aiProductType: currentAnalysis.extractedInfo.productType,
          aiColors: currentAnalysis.extractedInfo.visualFeatures.colors,
          aiContainerType: currentAnalysis.extractedInfo.visualFeatures.containerType,
          aiSize: currentAnalysis.extractedInfo.visualFeatures.size,
          imageUrl: currentAnalysis.imageUrl,
          imageAltText: createFormData.title,
          suggestedTitle: createFormData.title,
          suggestedPrice: parseFloat(createFormData.price),
          suggestedDescription: createFormData.description,
          suggestedProductType: createFormData.productType,
          suggestedTags: [createFormData.productType.toLowerCase()],
          priority: 'normal',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product inquiry');
      }

      // Update analysis status
      setAnalyses(prev =>
        prev.map(a =>
          a.imageId === currentAnalysis.imageId
            ? { ...a, assigned: true, selectedProductId: 'inquiry-' + data.inquiry.id }
            : a
        )
      );

      setShowCreateModal(false);
      showToast('success', `Product inquiry created for "${createFormData.title}"`);
      advanceToNextImage();
    } catch (error) {
      console.error('Error creating product inquiry:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to create inquiry');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const confirmAllHighConfidence = async () => {
    const highConfidence = analyses.filter(
      a => a.autoAssignRecommended && !a.assigned && a.matches.length > 0
    );

    if (highConfidence.length === 0) {
      showToast('error', 'No high confidence matches to confirm');
      return;
    }

    if (!confirm(`Assign ${highConfidence.length} image(s) to their matched products?`)) {
      return;
    }

    for (const analysis of highConfidence) {
      await assignImageToProduct(analysis, analysis.matches[0].productId, analysis.matches[0].productTitle);
    }
    
    showToast('success', `Assigned ${highConfidence.length} images to products`);
  };

  const clearResults = () => {
    setImages([]);
    setAnalyses([]);
    setCurrentImageIndex(0);
    setRecentlyCreatedProducts([]);
    sessionStorage.removeItem('recentlyCreatedProducts');
  };

  const currentAnalysis = analyses[currentImageIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-7 w-7 text-blue-600" />
            AI Product Image Analyzer
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload product images to automatically identify and match them to your catalog
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg p-4 flex items-center gap-3 ${
          toastMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <p className={`text-sm font-medium ${
            toastMessage.type === 'success' 
              ? 'text-green-900 dark:text-green-200' 
              : 'text-red-900 dark:text-red-200'
          }`}>
            {toastMessage.message}
          </p>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* API Key Missing Warning */}
      {apiKeyMissing && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                Anthropic API Key Required
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                Add <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> to your <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">.env.local</code> file to use this feature.
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-2">
                Get your API key at <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900">console.anthropic.com</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-500">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Product Inquiry
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* AI Extracted Info Reference */}
              {analyses[currentImageIndex]?.extractedInfo && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Detected Information
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    {analyses[currentImageIndex].extractedInfo.productName && (
                      <p>Name: {analyses[currentImageIndex].extractedInfo.productName}</p>
                    )}
                    {analyses[currentImageIndex].extractedInfo.scentName && (
                      <p>Scent: {analyses[currentImageIndex].extractedInfo.scentName}</p>
                    )}
                    {analyses[currentImageIndex].extractedInfo.productType && (
                      <p>Type: {analyses[currentImageIndex].extractedInfo.productType}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="e.g., Lavender Dreams 8oz Candle"
                />
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Type *
                </label>
                <select
                  value={createFormData.productType}
                  onChange={(e) => {
                    const preset = PRODUCT_TYPE_PRESETS.find(p => p.value === e.target.value);
                    setCreateFormData({
                      ...createFormData,
                      productType: e.target.value,
                      price: preset ? preset.defaultPrice.toString() : createFormData.price,
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  {PRODUCT_TYPE_PRESETS.map(preset => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={createFormData.price}
                    onChange={(e) => setCreateFormData({ ...createFormData, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="25.00"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Add product description..."
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProductInquiry}
                disabled={isCreatingProduct || !createFormData.title || !createFormData.price}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreatingProduct ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Creating Inquiry...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Send to Product Inquiry Jobs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {analyses.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upload Images
          </h3>

          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Drag and drop images here, or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              PNG, JPG, WebP • Max 10MB per file • Up to 10 images
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Images
            </button>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Selected Images ({images.length}/10)
                </h4>
                <button
                  onClick={analyzeImages}
                  disabled={isAnalyzing}
                  className="btn-primary"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={image.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {analyses.length > 0 && (
        <div className="space-y-4">
          {/* Bulk Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Image {currentImageIndex + 1} of {analyses.length} ({analyses.filter(a => a.assigned).length} processed)
                </span>
                {recentlyCreatedProducts.length > 0 && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
                    Recently Created: {recentlyCreatedProducts.length}
                  </span>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    disabled={currentImageIndex === 0}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(Math.min(analyses.length - 1, currentImageIndex + 1))}
                    disabled={currentImageIndex === analyses.length - 1}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={confirmAllHighConfidence}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 inline" />
                  Confirm All High Confidence
                </button>
                <button
                  onClick={clearResults}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Clear Results
                </button>
              </div>
            </div>
          </div>

          {/* Current Analysis */}
          {currentAnalysis && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Image and Extracted Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Uploaded Image
                  </h3>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4 relative">
                    {currentAnalysis.imageUrl ? (
                      <img
                        src={currentAnalysis.imageUrl}
                        alt="Analyzed product"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.error('Failed to load image:', currentAnalysis.imageUrl);
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex items-center justify-center h-full">
                                <div class="text-center p-4">
                                  <p class="text-red-600 dark:text-red-400 mb-2">Failed to load image</p>
                                  <p class="text-xs text-gray-500 dark:text-gray-400 break-all">${currentAnalysis.imageUrl}</p>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                          <p>No image URL</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Extracted Information
                    </h4>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-blue-700 dark:text-blue-300 font-medium">Product Name:</dt>
                        <dd className="text-blue-900 dark:text-blue-100">
                          {currentAnalysis.extractedInfo.productName || 'Not detected'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-blue-700 dark:text-blue-300 font-medium">Scent:</dt>
                        <dd className="text-blue-900 dark:text-blue-100">
                          {currentAnalysis.extractedInfo.scentName || 'Not detected'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-blue-700 dark:text-blue-300 font-medium">Product Type:</dt>
                        <dd className="text-blue-900 dark:text-blue-100">
                          {currentAnalysis.extractedInfo.productType || 'Not detected'}
                        </dd>
                      </div>
                      {currentAnalysis.extractedInfo.visualFeatures.colors.length > 0 && (
                        <div>
                          <dt className="text-blue-700 dark:text-blue-300 font-medium">Colors:</dt>
                          <dd className="text-blue-900 dark:text-blue-100">
                            {currentAnalysis.extractedInfo.visualFeatures.colors.join(', ')}
                          </dd>
                        </div>
                      )}
                      {currentAnalysis.extractedInfo.visualFeatures.containerType && (
                        <div>
                          <dt className="text-blue-700 dark:text-blue-300 font-medium">Container:</dt>
                          <dd className="text-blue-900 dark:text-blue-100">
                            {currentAnalysis.extractedInfo.visualFeatures.containerType}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Right: Matches */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Product Matches
                  </h3>

                  {currentAnalysis.assigned ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                      <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                        Image Assigned!
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        This image has been added to the product gallery
                      </p>
                    </div>
                  ) : currentAnalysis.matches.length === 0 && recentlyCreatedProducts.length === 0 ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                      <HelpCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2 text-center">
                        No Matches Found
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center mb-4">
                        The AI couldn't find a matching product in your catalog
                      </p>
                      <div className="flex justify-center">
                        <button 
                          onClick={openCreateModal}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Plus className="h-5 w-5" />
                          Create Product Inquiry
                          {currentAnalysis.extractedInfo.productName && (
                            <span className="text-xs opacity-75">
                              ({currentAnalysis.extractedInfo.productName})
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Existing Product Matches */}
                      {currentAnalysis.matches.slice(0, 3).map((match, index) => (
                        <div
                          key={match.productId}
                          className={`border rounded-lg p-4 ${
                            index === 0 && currentAnalysis.autoAssignRecommended
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {match.productTitle}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      match.confidence > 90
                                        ? 'bg-green-500'
                                        : match.confidence > 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${match.confidence}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {Math.round(match.confidence)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                            {match.matchReasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>

                          <button
                            onClick={() => assignImageToProduct(currentAnalysis, match.productId, match.productTitle)}
                            className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                              index === 0 && currentAnalysis.autoAssignRecommended
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            <Check className="h-4 w-4 mr-2 inline" />
                            {index === 0 && currentAnalysis.autoAssignRecommended
                              ? 'Confirm & Add to Product'
                              : 'Add to This Product'}
                          </button>
                        </div>
                      ))}

                      {/* Recently Created Products Section */}
                      {recentlyCreatedProducts.length > 0 && (
                        <div className="border border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Recently Created ({recentlyCreatedProducts.length})
                            </h4>
                            <button
                              onClick={() => setShowRecentlyCreated(!showRecentlyCreated)}
                              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                            >
                              {showRecentlyCreated ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {showRecentlyCreated && (
                            <div className="space-y-2">
                              {recentlyCreatedProducts.map((product) => (
                                <div
                                  key={product.id}
                                  className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                      {product.title}
                                    </h5>
                                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                                      {product.imageCount} {product.imageCount === 1 ? 'image' : 'images'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => assignImageToProduct(currentAnalysis, product.id, product.title)}
                                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add to This Product
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Create Product Inquiry Option */}
                      {(currentAnalysis.matches.length === 0 || 
                        (currentAnalysis.matches.length > 0 && currentAnalysis.matches[0].confidence < 50)) && (
                        <div className="border border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4">
                          <button
                            onClick={openCreateModal}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Plus className="h-5 w-5" />
                            Create Product Inquiry
                            {currentAnalysis.matches.length > 0 && (
                              <span className="text-xs opacity-75">(Low confidence matches)</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
