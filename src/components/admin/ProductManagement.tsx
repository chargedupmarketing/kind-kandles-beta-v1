'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Package,
  DollarSign,
  Tag,
  Save,
  X,
  Upload,
  Eye,
  EyeOff,
  ImagePlus,
  GripVertical,
  Copy,
  ExternalLink,
  AlertCircle,
  Check,
  Flame,
  Sparkles,
  Clock,
  Weight,
  Layers,
  Wand2,
  RefreshCw,
  CheckCircle2,
  Filter,
  Boxes,
  Minus,
  ArrowUpDown
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

interface ProductVariant {
  id?: string;
  title: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  weight: number | null;
  weight_unit: string;
  option1_name: string | null;
  option1_value: string | null;
  option2_name: string | null;
  option2_value: string | null;
  available_for_sale: boolean;
}

interface ProductImage {
  id?: string;
  url: string;
  alt_text: string;
  position: number;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  collection_id: string | null;
  tags: string[] | null;
  vendor: string | null;
  product_type: string | null;
  weight: number | null;
  weight_unit: string;
  created_at: string;
  variants: ProductVariant[];
  images: ProductImage[];
  collection?: { title: string };
}

interface Collection {
  id: string;
  title: string;
  handle: string;
}

// Product type presets for candle business
const PRODUCT_TYPE_PRESETS = [
  { value: 'candle', label: '🕯️ Candle', tags: ['candle', 'handmade'] },
  { value: 'body-butter', label: '✨ Body Butter', tags: ['skincare', 'body-butter', 'handmade'] },
  { value: 'body-oil', label: '🌿 Body Oil', tags: ['skincare', 'body-oil', 'natural'] },
  { value: 'room-spray', label: '🌸 Room Spray', tags: ['room-spray', 'fragrance'] },
  { value: 'bar-soap', label: '🧼 Bar Soap', tags: ['skincare', 'soap', 'handmade'] },
  { value: 'lotion', label: '🧴 Lotion', tags: ['skincare', 'lotion', 'handmade'] },
  { value: 'body-scrub', label: '✨ Body Scrub', tags: ['skincare', 'body-scrub', 'exfoliating'] },
  { value: 'other', label: '📦 Other', tags: [] },
];

// Scent profiles for candles
const SCENT_PROFILES = [
  { value: 'fresh', label: '🌊 Fresh', color: 'bg-blue-100 text-blue-700' },
  { value: 'floral', label: '🌸 Floral', color: 'bg-pink-100 text-pink-700' },
  { value: 'woodsy', label: '🌲 Woodsy', color: 'bg-green-100 text-green-700' },
  { value: 'sweet', label: '🍯 Sweet', color: 'bg-amber-100 text-amber-700' },
  { value: 'citrus', label: '🍋 Citrus', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'herbal', label: '🌿 Herbal', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'earthy', label: '🍂 Earthy', color: 'bg-orange-100 text-orange-700' },
];

// Burn time options for candles
const BURN_TIME_OPTIONS = [
  '20 hours', '30 hours', '40 hours', '45 hours', '50 hours', '60 hours', '70+ hours'
];

// Product type mapping for auto-organization
const PRODUCT_TYPE_KEYWORDS: { [key: string]: { type: string; tags: string[] } } = {
  'candle': { type: 'CANDLE', tags: ['candle'] },
  'soy candle': { type: 'CANDLE', tags: ['candle', 'soy-wax'] },
  'room spray': { type: 'ROOM SPRAY', tags: ['room-spray'] },
  'body spray': { type: 'BODY SPRAY MIST', tags: ['body-spray'] },
  'body mist': { type: 'BODY SPRAY MIST', tags: ['body-mist'] },
  'lotion': { type: 'LOTION', tags: ['lotion', 'skincare'] },
  'body butter': { type: 'BODY BUTTER', tags: ['body-butter', 'skincare'] },
  'whipped body butter': { type: 'BODY BUTTER', tags: ['body-butter', 'skincare'] },
  'scrub': { type: 'FOAMING BODY SCRUB', tags: ['body-scrub', 'skincare'] },
  'foaming body scrub': { type: 'FOAMING BODY SCRUB', tags: ['body-scrub', 'skincare'] },
  'bar soap': { type: 'BAR SOAP', tags: ['bar-soap', 'skincare'] },
  'handmade soap': { type: 'BAR SOAP', tags: ['bar-soap', 'skincare', 'handmade'] },
  'body oil': { type: 'BODY OIL', tags: ['body-oil', 'skincare'] },
  'hair oil': { type: 'BODY OIL', tags: ['hair-oil', 'skincare'] },
  'beard oil': { type: 'BODY OIL', tags: ['beard-oil', 'skincare'] },
  'wax melt': { type: 'WAX MELT', tags: ['wax-melt'] },
  't-shirt': { type: 'CLOTHING', tags: ['clothing-accessories'] },
  'tee': { type: 'CLOTHING', tags: ['clothing-accessories'] },
  'dress': { type: 'CLOTHING', tags: ['clothing-accessories'] },
  'hair wrap': { type: 'CLOTHING', tags: ['clothing-accessories'] },
  'tote bag': { type: 'CLOTHING', tags: ['clothing-accessories'] },
};

// Scent keywords for auto-tagging
const SCENT_KEYWORDS: { [key: string]: string } = {
  'eucalyptus': 'herbal',
  'spearmint': 'herbal',
  'peppermint': 'herbal',
  'rosemary': 'herbal',
  'lavender': 'floral',
  'rose': 'floral',
  'blossom': 'floral',
  'jasmine': 'floral',
  'lemon': 'citrus',
  'orange': 'citrus',
  'citrus': 'citrus',
  'squeeze': 'citrus',
  'grapefruit': 'citrus',
  'bergamot': 'citrus',
  'cedar': 'woodsy',
  'mahogany': 'woodsy',
  'wood': 'woodsy',
  'fir': 'woodsy',
  'evergreen': 'woodsy',
  'pine': 'woodsy',
  'sandalwood': 'woodsy',
  'linen': 'fresh',
  'fresh': 'fresh',
  'sea salt': 'fresh',
  'ocean': 'fresh',
  'waters': 'fresh',
  'clean': 'fresh',
  'sugar': 'sweet',
  'vanilla': 'sweet',
  'cheesecake': 'sweet',
  'butterscotch': 'sweet',
  'cocoa': 'sweet',
  'cashmere': 'sweet',
  'delightful': 'sweet',
  'honey': 'sweet',
  'caramel': 'sweet',
  'pumpkin': 'earthy',
  'ginger': 'earthy',
  'spice': 'earthy',
  'cinnamon': 'earthy',
  'nutmeg': 'earthy',
  'clove': 'earthy',
};

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCollection, setFilterCollection] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'images' | 'seo'>('basic');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizePreview, setOrganizePreview] = useState<{
    id: string;
    title: string;
    currentType: string | null;
    newType: string;
    currentTags: string[];
    newTags: string[];
    hasChanges: boolean;
  }[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<{ [productId: string]: number }>({});
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isSavingStock, setIsSavingStock] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    compare_at_price: '',
    collection_id: '',
    status: 'draft' as 'active' | 'draft' | 'archived',
    featured: false,
    tags: [] as string[],
    vendor: 'My Kind Kandles',
    product_type: '',
    weight: '',
    weight_unit: 'oz',
    // Variant data
    sku: '',
    inventory_quantity: '0',
    variant_title: 'Default Title',
    // Candle-specific
    scent_profile: '',
    burn_time: '',
    // Images
    images: [] as { url: string; alt_text: string }[],
    image_url: '', // For adding new image
  });

  useEffect(() => {
    fetchProducts();
    fetchCollections();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100&include_all=true');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const generateHandle = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      compare_at_price: '',
      collection_id: '',
      status: 'draft',
      featured: false,
      tags: [],
      vendor: 'My Kind Kandles',
      product_type: '',
      weight: '',
      weight_unit: 'oz',
      sku: '',
      inventory_quantity: '0',
      variant_title: 'Default Title',
      scent_profile: '',
      burn_time: '',
      images: [],
      image_url: '',
    });
    setActiveTab('basic');
    setIsCreating(true);
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    
    // Extract scent profile and burn time from tags
    const scentTag = product.tags?.find(t => SCENT_PROFILES.some(s => s.value === t.toLowerCase()));
    const burnTimeTag = product.tags?.find(t => t.toLowerCase().includes('hour'));
    
    setFormData({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      collection_id: product.collection_id || '',
      status: product.status,
      featured: product.featured,
      tags: product.tags?.filter(t => 
        !SCENT_PROFILES.some(s => s.value === t.toLowerCase()) && 
        !t.toLowerCase().includes('hour')
      ) || [],
      vendor: product.vendor || 'My Kind Kandles',
      product_type: product.product_type || '',
      weight: product.weight?.toString() || '',
      weight_unit: product.weight_unit || 'oz',
      sku: product.variants?.[0]?.sku || '',
      inventory_quantity: product.variants?.[0]?.inventory_quantity?.toString() || '0',
      variant_title: product.variants?.[0]?.title || 'Default Title',
      scent_profile: scentTag?.toLowerCase() || '',
      burn_time: burnTimeTag || '',
      images: product.images?.map(img => ({ url: img.url, alt_text: img.alt_text || '' })) || [],
      image_url: '',
    });
    setActiveTab('basic');
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleProductTypeSelect = (preset: typeof PRODUCT_TYPE_PRESETS[0]) => {
    const newTags = [...new Set([...formData.tags, ...preset.tags])];
    setFormData({ 
      ...formData, 
      product_type: preset.label.replace(/[^\w\s-]/g, '').trim(),
      tags: newTags
    });
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag.toLowerCase())) {
      setFormData({ ...formData, tags: [...formData.tags, tag.toLowerCase()] });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addImage = () => {
    if (formData.image_url) {
      setFormData({
        ...formData,
        images: [...formData.images, { url: formData.image_url, alt_text: formData.title }],
        image_url: ''
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...formData.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setFormData({ ...formData, images: newImages });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setUploadError('');
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;
    const newImages: { url: string; alt_text: string }[] = [];

    for (const file of Array.from(files)) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`${file.name} is too large. Max size is 5MB.`);
        continue;
      }

      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setUploadError(`${file.name} is not a valid image type.`);
        continue;
      }

      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('folder', 'products');

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formDataUpload
        });

        const data = await response.json();

        if (response.ok && data.url) {
          newImages.push({
            url: data.url,
            alt_text: formData.title || file.name.split('.')[0]
          });
        } else {
          setUploadError(data.error || `Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError(`Failed to upload ${file.name}`);
      }

      uploadedCount++;
      setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
    }

    if (newImages.length > 0) {
      setFormData({
        ...formData,
        images: [...formData.images, ...newImages]
      });
    }

    setIsUploadingImage(false);
    setUploadProgress(0);
    
    // Reset the file input
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price) {
      alert('Title and price are required');
      return;
    }

    setIsSaving(true);
    try {
      // Combine all tags including scent profile and burn time
      const allTags = [...formData.tags];
      if (formData.scent_profile) allTags.push(formData.scent_profile);
      if (formData.burn_time) allTags.push(formData.burn_time);

      const productData = {
        title: formData.title,
        handle: generateHandle(formData.title),
        description: formData.description || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        collection_id: formData.collection_id || null,
        status: formData.status,
        featured: formData.featured,
        tags: allTags.length > 0 ? allTags : null,
        vendor: formData.vendor || null,
        product_type: formData.product_type || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        weight_unit: formData.weight_unit,
        // Variant data
        variant: {
          title: formData.variant_title || 'Default Title',
          sku: formData.sku || null,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          inventory_quantity: parseInt(formData.inventory_quantity) || 0,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          weight_unit: formData.weight_unit,
        },
        // Images
        images: formData.images,
      };

      const url = isCreating 
        ? '/api/products'
        : `/api/products/${selectedProduct?.handle}`;
      
      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        setSuccessMessage(isCreating ? 'Product created successfully!' : 'Product updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
        setIsEditing(false);
        setIsCreating(false);
        setSelectedProduct(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/products/${product.handle}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });

      if (response.ok) {
        setSuccessMessage('Product deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleDuplicate = (product: Product) => {
    setFormData({
      title: `${product.title} (Copy)`,
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      collection_id: product.collection_id || '',
      status: 'draft',
      featured: false,
      tags: product.tags || [],
      vendor: product.vendor || 'My Kind Kandles',
      product_type: product.product_type || '',
      weight: product.weight?.toString() || '',
      weight_unit: product.weight_unit || 'oz',
      sku: '',
      inventory_quantity: '0',
      variant_title: 'Default Title',
      scent_profile: '',
      burn_time: '',
      images: product.images?.map(img => ({ url: img.url, alt_text: img.alt_text || '' })) || [],
      image_url: '',
    });
    setActiveTab('basic');
    setIsCreating(true);
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedProduct(null);
  };

  // Auto-detect product type and tags from title
  const detectProductInfo = (title: string): { type: string; tags: string[] } => {
    const lowerTitle = title.toLowerCase();
    let detectedType = '';
    const detectedTags: Set<string> = new Set();

    // Check for product type keywords (longest match first)
    const sortedKeywords = Object.keys(PRODUCT_TYPE_KEYWORDS).sort((a, b) => b.length - a.length);
    for (const keyword of sortedKeywords) {
      if (lowerTitle.includes(keyword)) {
        const info = PRODUCT_TYPE_KEYWORDS[keyword];
        if (!detectedType) {
          detectedType = info.type;
        }
        info.tags.forEach(tag => detectedTags.add(tag));
        break; // Only match the first (longest) product type
      }
    }

    // Check for scent keywords
    for (const [keyword, scentTag] of Object.entries(SCENT_KEYWORDS)) {
      if (lowerTitle.includes(keyword)) {
        detectedTags.add(scentTag);
      }
    }

    // Check for "calm down girl" collection
    if (lowerTitle.includes('calm down girl')) {
      detectedTags.add('calm-down-girl');
    }

    return {
      type: detectedType || 'OTHER',
      tags: Array.from(detectedTags)
    };
  };

  // Generate preview of organization changes
  const generateOrganizePreview = () => {
    const preview = products.map(product => {
      const detected = detectProductInfo(product.title);
      const currentTags = product.tags || [];
      const newTags = [...new Set([...currentTags, ...detected.tags])];
      
      const hasChanges = 
        (detected.type && detected.type !== product.product_type) ||
        newTags.length !== currentTags.length ||
        !newTags.every(t => currentTags.includes(t));

      return {
        id: product.id,
        title: product.title,
        currentType: product.product_type,
        newType: detected.type || product.product_type || 'OTHER',
        currentTags: currentTags,
        newTags: newTags,
        hasChanges
      };
    });

    setOrganizePreview(preview);
    setShowOrganizeModal(true);
  };

  // Apply organization changes
  const applyOrganization = async () => {
    const changedProducts = organizePreview.filter(p => p.hasChanges);
    if (changedProducts.length === 0) {
      setSuccessMessage('No changes to apply');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    setIsOrganizing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const product of changedProducts) {
      try {
        const response = await fetch(`/api/admin/products/${product.id}/organize`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_type: product.newType,
            tags: product.newTags
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error('Error updating product:', error);
        errorCount++;
      }
    }

    setIsOrganizing(false);
    setShowOrganizeModal(false);
    
    if (errorCount === 0) {
      setSuccessMessage(`Successfully organized ${successCount} products!`);
    } else {
      setSuccessMessage(`Organized ${successCount} products (${errorCount} failed)`);
    }
    setTimeout(() => setSuccessMessage(''), 5000);
    
    // Refresh products list
    fetchProducts();
  };

  // Bulk update selected products
  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.size === 0) return;

    const [action, value] = bulkAction.split(':');
    
    if (action === 'status') {
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        if (product) {
          try {
            await fetch(`/api/admin/products/${productId}/organize`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: value })
            });
          } catch (error) {
            console.error('Error updating product status:', error);
          }
        }
      }
    } else if (action === 'tag') {
      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const newTags = [...new Set([...(product.tags || []), value])];
          try {
            await fetch(`/api/admin/products/${productId}/organize`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tags: newTags })
            });
          } catch (error) {
            console.error('Error updating product tags:', error);
          }
        }
      }
    } else if (action === 'type') {
      for (const productId of selectedProducts) {
        try {
          await fetch(`/api/admin/products/${productId}/organize`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_type: value })
          });
        } catch (error) {
          console.error('Error updating product type:', error);
        }
      }
    }

    setSuccessMessage(`Updated ${selectedProducts.size} products`);
    setTimeout(() => setSuccessMessage(''), 3000);
    setSelectedProducts(new Set());
    setBulkAction('');
    fetchProducts();
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  // Stock Management Functions
  const openStockModal = () => {
    // Initialize stock updates with current values
    const initialStock: { [productId: string]: number } = {};
    products.forEach(product => {
      initialStock[product.id] = product.variants?.[0]?.inventory_quantity || 0;
    });
    setStockUpdates(initialStock);
    setShowStockModal(true);
  };

  const updateStockValue = (productId: string, value: number) => {
    setStockUpdates(prev => ({
      ...prev,
      [productId]: Math.max(0, value)
    }));
  };

  const adjustStock = (productId: string, adjustment: number) => {
    setStockUpdates(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + adjustment)
    }));
  };

  const getStockFilteredProducts = () => {
    return products.filter(product => {
      const currentStock = product.variants?.[0]?.inventory_quantity || 0;
      if (stockFilter === 'low') return currentStock > 0 && currentStock <= 5;
      if (stockFilter === 'out') return currentStock === 0;
      return true;
    });
  };

  const getChangedStockProducts = () => {
    return products.filter(product => {
      const originalStock = product.variants?.[0]?.inventory_quantity || 0;
      const newStock = stockUpdates[product.id];
      return newStock !== undefined && newStock !== originalStock;
    });
  };

  const saveStockUpdates = async () => {
    const changedProducts = getChangedStockProducts();
    if (changedProducts.length === 0) {
      setSuccessMessage('No changes to save');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    setIsSavingStock(true);
    let successCount = 0;
    let errorCount = 0;

    for (const product of changedProducts) {
      try {
        const response = await fetch(`/api/admin/products/${product.id}/stock`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({
            inventory_quantity: stockUpdates[product.id]
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error('Error updating stock:', error);
        errorCount++;
      }
    }

    setIsSavingStock(false);
    setShowStockModal(false);

    if (errorCount === 0) {
      setSuccessMessage(`Successfully updated stock for ${successCount} products!`);
    } else {
      setSuccessMessage(`Updated ${successCount} products (${errorCount} failed)`);
    }
    setTimeout(() => setSuccessMessage(''), 5000);
    
    fetchProducts();
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants?.[0]?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesCollection = filterCollection === 'all' || p.collection_id === filterCollection;
    return matchesSearch && matchesStatus && matchesCollection;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <Check className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {products.length} total • {products.filter(p => p.status === 'active').length} active
          </p>
        </div>
        <div className="hidden sm:flex gap-3">
          <button
            onClick={openStockModal}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-lg text-sm"
          >
            <Boxes className="h-5 w-5" />
            Manage Stock
          </button>
          <button
            onClick={generateOrganizePreview}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg text-sm"
          >
            <Wand2 className="h-5 w-5" />
            Auto-Organize
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-lg text-sm"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden grid grid-cols-3 gap-2">
        <button
          onClick={openStockModal}
          className="flex flex-col items-center justify-center gap-1 bg-teal-600 text-white px-3 py-3 rounded-xl hover:bg-teal-700 transition-colors shadow-lg"
        >
          <Boxes className="h-5 w-5" />
          <span className="text-xs font-medium">Manage Stock</span>
        </button>
        <button
          onClick={generateOrganizePreview}
          className="flex flex-col items-center justify-center gap-1 bg-purple-600 text-white px-3 py-3 rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
        >
          <Wand2 className="h-5 w-5" />
          <span className="text-xs font-medium">Organize</span>
        </button>
        <button
          onClick={handleCreate}
          className="flex flex-col items-center justify-center gap-1 bg-pink-600 text-white px-3 py-3 rounded-xl hover:bg-pink-700 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={filterCollection}
            onChange={(e) => setFilterCollection(e.target.value)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="all">All Collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Form Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-none sm:rounded-xl shadow-2xl w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-500 sticky top-0 z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                {isCreating ? <Plus className="h-4 w-4 sm:h-5 sm:w-5" /> : <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                {isCreating ? 'Add Product' : 'Edit Product'}
              </h3>
              <button onClick={handleCancel} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
              {[
                { id: 'basic', label: 'Basic', fullLabel: 'Basic Info', icon: Package },
                { id: 'variants', label: 'Inventory', fullLabel: 'Inventory & Pricing', icon: Layers },
                { id: 'images', label: 'Images', fullLabel: 'Images', icon: ImagePlus },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 font-medium transition-colors whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? 'text-pink-600 border-b-2 border-pink-600 bg-white dark:bg-gray-900'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Calm Down Girl - Eucalyptus & Spearmint Candle"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 text-lg"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Handle: {generateHandle(formData.title) || 'product-handle'}
                    </p>
                  </div>

                  {/* Product Type Quick Select */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Product Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCT_TYPE_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handleProductTypeSelect(preset)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            formData.product_type?.toLowerCase().includes(preset.value)
                              ? 'bg-pink-600 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Describe your product in detail. Include scent notes, ingredients, benefits..."
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>

                  {/* Collection & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Collection
                      </label>
                      <select
                        value={formData.collection_id}
                        onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="">Select collection</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="draft">🔒 Draft (Hidden)</option>
                        <option value="active">✅ Active (Visible)</option>
                        <option value="archived">📦 Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Candle-specific: Scent Profile */}
                  {formData.product_type?.toLowerCase().includes('candle') && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <Sparkles className="inline h-4 w-4 mr-1" />
                        Scent Profile
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SCENT_PROFILES.map((scent) => (
                          <button
                            key={scent.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, scent_profile: scent.value })}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              formData.scent_profile === scent.value
                                ? `${scent.color} ring-2 ring-offset-2 ring-pink-500`
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {scent.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Candle-specific: Burn Time */}
                  {formData.product_type?.toLowerCase().includes('candle') && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Burn Time
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {BURN_TIME_OPTIONS.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setFormData({ ...formData, burn_time: time })}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              formData.burn_time === time
                                ? 'bg-amber-500 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            🕯️ {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <Tag className="inline h-4 w-4 mr-1" />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-pink-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a tag and press Enter"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Suggested: handmade, natural, vegan, soy-wax, limited-edition
                    </p>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="featured" className="flex items-center gap-2 cursor-pointer">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Featured Product</span>
                      <span className="text-sm text-gray-500">(Show on homepage)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Inventory & Pricing Tab */}
              {activeTab === 'variants' && (
                <div className="space-y-6">
                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Price *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 text-lg font-semibold"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Compare at Price <span className="text-gray-400">(Original)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.compare_at_price}
                          onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                          placeholder="Leave empty if not on sale"
                          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                        />
                      </div>
                      {formData.compare_at_price && parseFloat(formData.compare_at_price) > parseFloat(formData.price) && (
                        <p className="mt-1 text-sm text-green-600 font-medium">
                          💰 {Math.round((1 - parseFloat(formData.price) / parseFloat(formData.compare_at_price)) * 100)}% off
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SKU & Inventory */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        SKU (Stock Keeping Unit)
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        placeholder="e.g., CDG-EUC-8OZ"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Inventory Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.inventory_quantity}
                        onChange={(e) => setFormData({ ...formData, inventory_quantity: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 text-lg font-semibold"
                      />
                      {parseInt(formData.inventory_quantity) < 5 && parseInt(formData.inventory_quantity) > 0 && (
                        <p className="mt-1 text-sm text-orange-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Low stock warning
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <Weight className="inline h-4 w-4 mr-1" />
                        Weight
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="e.g., 8"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Weight Unit
                      </label>
                      <select
                        value={formData.weight_unit}
                        onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="oz">Ounces (oz)</option>
                        <option value="lb">Pounds (lb)</option>
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                      </select>
                    </div>
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Vendor
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
              )}

              {/* Images Tab */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  {/* Upload from Device */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Upload from Device
                    </label>
                    <div 
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isUploadingImage 
                          ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 hover:bg-pink-50/50 dark:hover:bg-pink-900/10'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleFileUpload}
                        disabled={isUploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-10 w-10 border-3 border-pink-600 border-t-transparent mb-2" />
                          <p className="text-pink-600 font-medium">Uploading...</p>
                          {uploadProgress > 0 && (
                            <p className="text-sm text-gray-500 mt-1">{uploadProgress}% complete</p>
                          )}
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600 dark:text-gray-400 font-medium">
                            Click or drag images here
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPEG, PNG, WebP, GIF • Max 5MB each
                          </p>
                        </>
                      )}
                    </div>
                    {uploadError && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {uploadError}
                      </p>
                    )}
                  </div>

                  {/* Or add by URL */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white dark:bg-gray-900 text-gray-500">or add by URL</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={addImage}
                        disabled={!formData.image_url}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Image Grid */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Product Images ({formData.images.length})
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt={image.alt_text || formData.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveImage(index, 'up')}
                              disabled={index === 0}
                              className="p-2 bg-white/90 text-gray-700 rounded-lg hover:bg-white disabled:opacity-30"
                              title="Move left"
                            >
                              <GripVertical className="h-4 w-4 rotate-90" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(index, 'down')}
                              disabled={index === formData.images.length - 1}
                              className="p-2 bg-white/90 text-gray-700 rounded-lg hover:bg-white disabled:opacity-30"
                              title="Move right"
                            >
                              <GripVertical className="h-4 w-4 -rotate-90" />
                            </button>
                          </div>
                          {index === 0 && (
                            <span className="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                      
                      {formData.images.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg text-gray-400">
                          <ImagePlus className="h-12 w-12 mb-2" />
                          <p>No images added yet</p>
                          <p className="text-sm">Upload images or add URLs above</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-500">
                {isCreating ? 'Creating new product' : `Editing: ${selectedProduct?.title}`}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.title || !formData.price}
                  className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isCreating ? 'Create Product' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-900 dark:text-purple-100">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Select action...</option>
              <optgroup label="Change Status">
                <option value="status:active">Set Active</option>
                <option value="status:draft">Set Draft</option>
                <option value="status:archived">Set Archived</option>
              </optgroup>
              <optgroup label="Add Tag">
                <option value="tag:calm-down-girl">Add: calm-down-girl</option>
                <option value="tag:herbal">Add: herbal</option>
                <option value="tag:floral">Add: floral</option>
                <option value="tag:citrus">Add: citrus</option>
                <option value="tag:woodsy">Add: woodsy</option>
                <option value="tag:fresh">Add: fresh</option>
                <option value="tag:sweet">Add: sweet</option>
                <option value="tag:earthy">Add: earthy</option>
              </optgroup>
              <optgroup label="Set Product Type">
                <option value="type:CANDLE">Set Type: CANDLE</option>
                <option value="type:ROOM SPRAY">Set Type: ROOM SPRAY</option>
                <option value="type:BODY BUTTER">Set Type: BODY BUTTER</option>
                <option value="type:BODY OIL">Set Type: BODY OIL</option>
                <option value="type:BAR SOAP">Set Type: BAR SOAP</option>
                <option value="type:LOTION">Set Type: LOTION</option>
                <option value="type:FOAMING BODY SCRUB">Set Type: FOAMING BODY SCRUB</option>
                <option value="type:WAX MELT">Set Type: WAX MELT</option>
                <option value="type:CLOTHING">Set Type: CLOTHING</option>
              </optgroup>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Manage Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-teal-500 to-emerald-500">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Manage Inventory
              </h3>
              <button 
                onClick={() => setShowStockModal(false)} 
                className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filter:</span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All Products', count: products.length },
                  { value: 'low', label: 'Low Stock', count: products.filter(p => (p.variants?.[0]?.inventory_quantity || 0) > 0 && (p.variants?.[0]?.inventory_quantity || 0) <= 5).length },
                  { value: 'out', label: 'Out of Stock', count: products.filter(p => (p.variants?.[0]?.inventory_quantity || 0) === 0).length },
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setStockFilter(filter.value as typeof stockFilter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      stockFilter === filter.value
                        ? 'bg-teal-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
              {getChangedStockProducts().length > 0 && (
                <span className="ml-auto text-sm text-teal-600 dark:text-teal-400 font-medium">
                  {getChangedStockProducts().length} pending changes
                </span>
              )}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {getStockFilteredProducts().map((product) => {
                  const originalStock = product.variants?.[0]?.inventory_quantity || 0;
                  const newStock = stockUpdates[product.id] ?? originalStock;
                  const hasChanged = newStock !== originalStock;
                  const stockStatus = newStock === 0 ? 'out' : newStock <= 5 ? 'low' : 'good';
                  
                  return (
                    <div 
                      key={product.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                        hasChanged 
                          ? 'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-900/20' 
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                      }`}
                    >
                      {/* Product Image */}
                      {product.images?.[0]?.url ? (
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={product.images[0].url}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {product.variants?.[0]?.sku || 'N/A'}
                        </p>
                      </div>

                      {/* Stock Status Badge */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stockStatus === 'out' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : stockStatus === 'low'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {stockStatus === 'out' ? 'Out of Stock' : stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
                      </div>

                      {/* Stock Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustStock(product.id, -1)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          disabled={newStock <= 0}
                        >
                          <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={newStock}
                          onChange={(e) => updateStockValue(product.id, parseInt(e.target.value) || 0)}
                          className={`w-16 px-2 py-1.5 text-center border rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 ${
                            hasChanged 
                              ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/30 dark:border-teal-600' 
                              : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700'
                          }`}
                        />
                        <button
                          onClick={() => adjustStock(product.id, 1)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>

                      {/* Change Indicator */}
                      {hasChanged && (
                        <div className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400">
                          <ArrowUpDown className="h-3 w-3" />
                          <span>{originalStock} → {newStock}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {getStockFilteredProducts().length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No products match this filter</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-500">
                {getChangedStockProducts().length > 0 ? (
                  <span className="text-teal-600 dark:text-teal-400 font-medium">
                    {getChangedStockProducts().length} products will be updated
                  </span>
                ) : (
                  'No changes made'
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveStockUpdates}
                  disabled={isSavingStock || getChangedStockProducts().length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isSavingStock ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Organize Modal */}
      {showOrganizeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Auto-Organize Products
              </h3>
              <button 
                onClick={() => setShowOrganizeModal(false)} 
                className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Review the suggested changes below. Products will be automatically categorized based on their titles.
              </p>
              
              <div className="mb-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Will be updated ({organizePreview.filter(p => p.hasChanges).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <span>No changes ({organizePreview.filter(p => !p.hasChanges).length})</span>
                </div>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {organizePreview.map((product) => (
                  <div 
                    key={product.id}
                    className={`p-4 rounded-lg border ${
                      product.hasChanges 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {product.title}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Type: </span>
                            {product.currentType !== product.newType ? (
                              <>
                                <span className="line-through text-gray-400">{product.currentType || 'None'}</span>
                                <span className="text-green-600 font-medium ml-2">→ {product.newType}</span>
                              </>
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300">{product.newType || 'None'}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-500">Tags: </span>
                            <div className="inline-flex flex-wrap gap-1 mt-1">
                              {product.newTags.map(tag => (
                                <span 
                                  key={tag}
                                  className={`px-2 py-0.5 rounded-full text-xs ${
                                    product.currentTags.includes(tag)
                                      ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                      : 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200'
                                  }`}
                                >
                                  {!product.currentTags.includes(tag) && '+ '}
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {product.hasChanges && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-500">
                {organizePreview.filter(p => p.hasChanges).length} products will be updated
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOrganizeModal(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyOrganization}
                  disabled={isOrganizing || organizePreview.filter(p => p.hasChanges).length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isOrganizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Organizing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Apply Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products - Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {filteredProducts.map((product) => (
          <div 
            key={product.id}
            className={`bg-white dark:bg-gray-900 rounded-xl shadow p-4 ${
              selectedProducts.has(product.id) ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <div className="flex gap-3">
              <input
                type="checkbox"
                checked={selectedProducts.has(product.id)}
                onChange={() => toggleProductSelection(product.id)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 mt-1"
              />
              {product.images?.[0]?.url ? (
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={product.images[0].url}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{product.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">SKU: {product.variants?.[0]?.sku || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-700'
                      : product.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {product.status}
                  </span>
                  {product.featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Flame className="h-3 w-3" />
                    </span>
                  )}
                  {(() => {
                    const totalQty = product.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        totalQty === 0
                          ? 'bg-red-100 text-red-700'
                          : totalQty <= 5
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        <Boxes className="h-3 w-3" />
                        {totalQty}
                      </span>
                    );
                  })()}
                  <span className="font-semibold text-pink-600 ml-auto">{formatPrice(product.price)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t dark:border-gray-700">
              <button
                onClick={() => handleDuplicate(product)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Copy className="h-4 w-4 text-gray-500" />
              </button>
              <button
                onClick={() => handleEdit(product)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4 text-gray-500" />
              </button>
              <a
                href={`/products/${product.handle}`}
                target="_blank"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-gray-500" />
              </a>
              <button
                onClick={() => handleDelete(product)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Products Table - Desktop */}
      <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={selectAllProducts}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 hidden lg:table-cell">Type / Tags</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Price</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">QOH</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    selectedProducts.has(product.id) ? 'bg-purple-50 dark:bg-purple-900/10' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.url ? (
                        <div className="relative w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={product.images[0].url}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 lg:h-6 lg:w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[200px]">{product.title}</p>
                        <p className="text-xs text-gray-500">
                          SKU: {product.variants?.[0]?.sku || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.product_type || 'No type'}
                      </span>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {product.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{product.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.status === 'active' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : product.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {product.status === 'active' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span className="hidden md:inline">{product.status}</span>
                    </span>
                    {product.featured && (
                      <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Flame className="h-3 w-3" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatPrice(product.price)}</p>
                      {product.compare_at_price && (
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice(product.compare_at_price)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {(() => {
                        const totalQty = product.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${
                            totalQty === 0
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : totalQty <= 5
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            <Boxes className="h-3.5 w-3.5" />
                            {totalQty}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <a
                        href={`/products/${product.handle}`}
                        target="_blank"
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="View"
                      >
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                    </a>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterStatus !== 'all' || filterCollection !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first product'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterCollection === 'all' && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Your First Product
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
