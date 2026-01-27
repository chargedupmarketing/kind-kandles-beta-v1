'use client';

import { useState, useRef } from 'react';
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

export default function ProductImageAnalyzer() {
  const [images, setImages] = useState<File[]>([]);
  const [analyses, setAnalyses] = useState<ImageAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const formData = new FormData();
      images.forEach(image => {
        formData.append('images', image);
      });

      const response = await fetch('/api/admin/ai/analyze-product-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('API key')) {
          setApiKeyMissing(true);
        }
        throw new Error(data.error || 'Failed to analyze images');
      }

      setAnalyses(data.analyses || []);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error('Error analyzing images:', error);
      alert(error instanceof Error ? error.message : 'Failed to analyze images');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const assignImageToProduct = async (analysis: ImageAnalysis, productId: string) => {
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

      alert('Image successfully added to product!');
    } catch (error) {
      console.error('Error assigning image:', error);
      alert(error instanceof Error ? error.message : 'Failed to assign image');
    }
  };

  const confirmAllHighConfidence = async () => {
    const highConfidence = analyses.filter(
      a => a.autoAssignRecommended && !a.assigned && a.matches.length > 0
    );

    if (highConfidence.length === 0) {
      alert('No high confidence matches to confirm');
      return;
    }

    if (!confirm(`Assign ${highConfidence.length} image(s) to their matched products?`)) {
      return;
    }

    for (const analysis of highConfidence) {
      await assignImageToProduct(analysis, analysis.matches[0].productId);
    }
  };

  const clearResults = () => {
    setImages([]);
    setAnalyses([]);
    setCurrentImageIndex(0);
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Image {currentImageIndex + 1} of {analyses.length}
                </span>
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
              <div className="flex gap-2">
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
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={currentAnalysis.imageUrl}
                      alt="Analyzed product"
                      width={400}
                      height={400}
                      className="w-full h-full object-contain"
                    />
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
                  ) : currentAnalysis.matches.length === 0 ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                      <HelpCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2 text-center">
                        No Matches Found
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center mb-4">
                        The AI couldn't find a matching product in your catalog
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                          <Plus className="h-4 w-4 mr-2 inline" />
                          Create New Product
                        </button>
                        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                          <Search className="h-4 w-4 mr-2 inline" />
                          Search Products
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentAnalysis.matches.map((match, index) => (
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
                            onClick={() => assignImageToProduct(currentAnalysis, match.productId)}
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
