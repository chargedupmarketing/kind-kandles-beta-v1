// Product types for the application

// Database product type
export interface ProductDB {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  collection_id: string | null;
  tags: string[] | null;
  vendor: string | null;
  product_type: string | null;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  weight: number | null;
  weight_unit: 'lb' | 'oz' | 'kg' | 'g';
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

// Product type for display components (used by ProductPage)
export interface Product {
  id: string;
  name: string;
  handle: string;
  price: string;
  originalPrice?: string;
  description: string;
  image: string;
  category?: string;
  inStock: boolean;
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  ingredients?: string;
  careInstructions?: string;
  isCandle?: boolean;
  burnTime?: string;
  scentProfile?: string;
  rating?: number;
  reviewCount?: number;
  stockLevel?: number;
  isHandmade?: boolean;
  isNatural?: boolean;
}

// Product type for FeaturedProductsSlider and other components
export interface DisplayProduct {
  id: string;
  title: string;
  handle: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  images?: string[];
  category?: string;
  badge?: string;
  inventoryQuantity?: number;
  isCandle?: boolean;
  burnTime?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  weight: number | null;
  weight_unit: 'lb' | 'oz' | 'kg' | 'g';
  option1_name: string | null;
  option1_value: string | null;
  option2_name: string | null;
  option2_value: string | null;
  option3_name: string | null;
  option3_value: string | null;
  available_for_sale: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  position: number;
  created_at: string;
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  price: number;
  quantity: number;
  image?: string;
  handle: string;
  sku?: string;
  weight?: number;
  weightUnit?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  title: string;
  variant_title: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  price: number;
  estimatedDays?: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  min_purchase: number | null;
  max_uses: number | null;
  uses: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
}

// =====================================================
// EVENT SYSTEM TYPES
// =====================================================

export type EventType = 'workshop' | 'class' | 'community' | 'private' | 'other';
export type LocationType = 'mobile' | 'fixed' | 'both';
export type PricingModel = 'per_person' | 'flat_rate' | 'custom_quote' | 'tiered';
export type OccurrenceStatus = 'available' | 'full' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded';

export interface PriceTier {
  min: number;
  max: number;
  price: number;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  position: number;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  event_type: EventType;
  location_type: LocationType;
  fixed_location_address: string | null;
  duration_minutes: number;
  min_participants: number;
  max_participants: number;
  pricing_model: PricingModel;
  base_price: number | null;
  price_tiers: PriceTier[] | null;
  deposit_required: boolean;
  deposit_amount: number | null;
  image_url: string | null;
  gallery_images: string[] | null;
  includes: string[] | null;
  requirements: string[] | null;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: EventCategory[];
  next_occurrence?: EventOccurrence;
  upcoming_occurrences?: EventOccurrence[];
}

export interface EventOccurrence {
  id: string;
  event_id: string;
  start_datetime: string;
  end_datetime: string;
  location_type: LocationType | null;
  location_address: string | null;
  max_participants: number | null;
  current_bookings: number;
  status: OccurrenceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export interface EventBooking {
  id: string;
  event_id: string;
  occurrence_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  num_participants: number;
  location_preference: LocationType | null;
  requested_address: string | null;
  requested_date: string | null;
  requested_time: string | null;
  special_requests: string | null;
  total_price: number | null;
  status: BookingStatus;
  payment_status: PaymentStatus;
  confirmation_sent_at: string | null;
  admin_notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  event?: Event;
  occurrence?: EventOccurrence;
}export interface EventBookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  num_participants: number;
  location_preference?: LocationType;
  requested_address?: string;
  requested_date?: string;
  requested_time?: string;
  special_requests?: string;
  occurrence_id?: string;
}
